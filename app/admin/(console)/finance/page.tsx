"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { formatFinanceKind } from "@/features/finance/FinanceRequestCard";
import { financeStatusTone, formatFinanceStatus } from "@/features/finance/types";
import type { FinanceKind, FinanceRequest } from "@/features/finance/types";

export default function AdminFinancePage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<FinanceRequest[]>([]);
  const [kind, setKind] = useState<"ALL" | FinanceKind>("ALL");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "RECEIVED" | "REJECTED">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (kind !== "ALL") params.set("kind", kind);
    if (status !== "ALL") params.set("status", status);
    setLoading(true);
    api<FinanceRequest[]>(`/api/v1/finance/requests?${params}`, { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => flash.fail(e, "Failed to load finance requests"))
      .finally(() => setLoading(false));
  }, [token, kind, status]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.retailer_name, r.retailer_code, r.utr].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-200/80 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
          Finance
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-950">Activation & wallet requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track proofs submitted for outlet activation and wallet top-ups. Auditors mark payments received.
        </p>
      </div>
      <Flash message={flash.message} error={flash.error} />
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["ALL", "ACTIVATION", "WALLET_TOPUP", "EARNINGS_WITHDRAW"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${kind === k ? "bg-navy-950 text-white" : "text-slate-600"}`}>
                {k === "ALL" ? "All" : formatFinanceKind(k)}
              </button>
            ))}
          </div>
          <div className="relative min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="field !pl-10 !py-2 text-xs w-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
          </div>
        </div>
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No requests" body="Submit an activation or wallet proof from a retailer profile." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4 text-right">Outlet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{r.retailer_name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{r.retailer_code}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{formatFinanceKind(r.kind)}</td>
                    <td className="px-6 py-4 font-mono font-bold">{inr(r.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusPill value={financeStatusTone(r.kind, r.status)} label={formatFinanceStatus(r.kind, r.status)} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.created_at ? when(r.created_at) : "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/retailers/${r.retailer_user_id}`} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        Open <ArrowRight className="h-3 w-3" />
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
