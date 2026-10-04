"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Copy, 
  FileText, 
  IndianRupee, 
  Percent, 
  Search, 
  TrendingUp, 
  XCircle 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, txnLabel, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { TxnRow } from "@/features/admin/types";
import Link from "next/link";

export default function AgentTransactionsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api<TxnRow[]>("/api/v1/desk/transactions", { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => flash.fail(e, "Failed to load transactions"))
      .finally(() => setLoading(false));
  }, [token]);

  function copy(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalGmv = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const r of rows) {
      const amt = Number(r.amount) || 0;
      totalGmv += amt;
      if (r.state === "SUCCESS" || r.state === "COMPLETED") successCount++;
      if (r.state === "FAILED" || r.state === "REJECTED") failedCount++;
    }

    const rate = rows.length > 0 ? Math.round((successCount / rows.length) * 100) : 100;
    return { totalGmv, successCount, failedCount, rate };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.state !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.txn_type !== typeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.txn_type.toLowerCase().includes(q) ||
          (r.partner_ref && r.partner_ref.toLowerCase().includes(q)) ||
          String(r.amount).includes(q)
        );
      }
      return true;
    });
  }, [rows, statusFilter, typeFilter, query]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Outlet Ledger
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Transactions & Receipts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Realtime audit stream for all counter sends, cash withdrawals, and bill payments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Volume"
          value={inr(metrics.totalGmv)}
          hint={`${rows.length} total transfers`}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Success Rate"
          value={`${metrics.rate}%`}
          hint={`${metrics.successCount} successful`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Successful Sends"
          value={String(metrics.successCount)}
          hint="Completed orders"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Failed / Declined"
          value={String(metrics.failedCount)}
          hint="Requires review"
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["ALL", "SUCCESS", "PENDING", "FAILED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  statusFilter === s
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {s === "ALL" ? "All Statuses" : s}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, UTR, or Amount..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No transactions match your search"
            body={query || statusFilter !== "ALL" ? "Try clearing search or status filters." : "Completed counter sales will appear here."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Reference & Service</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-950 text-sm">
                            {txnLabel(t.txn_type)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">
                            {t.id.slice(0, 12)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(t.id)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700"
                            title="Copy ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedId === t.id && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={t.state} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {t.created_at ? when(t.created_at) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-display font-bold text-navy-950 text-base">
                        {inr(t.amount)}
                      </span>
                      {Number(t.fee || 0) > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Fee: {inr(t.fee)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/agent/transactions/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Receipt
                        <ArrowRight className="h-3 w-3" />
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
