"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";

type Customer = {
  full_name: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  retailer_name?: string;
  ekyc_status?: string;
  created_at?: string;
  services?: { id: string; item_name: string; category_name: string; state: string; budget?: number; created_at?: string }[];
  transactions?: { id: string; txn_type: string; state: string; amount: number; created_at?: string }[];
};

export default function AuditorCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const [row, setRow] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    api<Customer>(`/api/v1/customers/${id}`, { token })
      .then(setRow)
      .catch((e) => setError(formatApiError(e, "Failed to load customer")));
  }, [token, id]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!row) return <div className="card h-48 animate-pulse bg-slate-100" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/auditor/customers" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950">
        ← Customers
      </Link>
      <section className="rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 text-white shadow-xl space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Customer</span>
          <EkycBadge status={row.ekyc_status} />
        </div>
        <h1 className="font-display text-3xl font-bold">{row.full_name}</h1>
        <p className="text-sm text-slate-300">
          {maskMobile(row.mobile)} · {[row.city, row.state, row.pincode].filter(Boolean).join(", ") || "—"}
        </p>
        <p className="text-xs text-slate-400">Retailer {row.retailer_name ?? "—"} · Added {row.created_at ? when(row.created_at) : "—"}</p>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-navy-950">Sales</h2>
        {!row.services?.length ? (
          <EmptyState title="No sales" body="Leads for this customer appear here." />
        ) : (
          <DataTable
            columns={["Product", "Category", "State", "Budget", "When"]}
            rows={row.services.map((s) => [
              s.item_name,
              s.category_name,
              <StatusPill key={s.id} value={s.state} />,
              s.budget != null ? inr(s.budget) : "—",
              s.created_at ? when(s.created_at) : "—",
            ])}
          />
        )}
      </section>
    </div>
  );
}
