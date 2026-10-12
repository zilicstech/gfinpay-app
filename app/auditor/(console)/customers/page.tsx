"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  retailer_name?: string;
  ekyc_status?: string;
  created_at?: string;
};

export default function AuditorCustomersPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Customer[]>("/api/v1/customers", { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => flash.fail(e, "Failed to load customers"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((c) =>
      [c.full_name, c.mobile, c.retailer_name, c.city].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-200/80 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
          Directory
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-950">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only view of every customer on the platform.</p>
      </div>
      <Flash message={flash.message} error={flash.error} />
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="field !pl-10 !py-2 text-xs w-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" />
        </div>
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers" body="Customer records appear as outlets register them." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">eKYC</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-950">{c.full_name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{maskMobile(c.mobile)}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{c.retailer_name ?? "—"}</td>
                    <td className="px-6 py-4 text-xs">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-6 py-4"><StatusPill value={c.ekyc_status ?? "NOT_STARTED"} /></td>
                    <td className="px-6 py-4 text-xs text-slate-500">{c.created_at ? when(c.created_at) : "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/auditor/customers/${c.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
