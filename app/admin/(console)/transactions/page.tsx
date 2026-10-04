"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Copy, 
  Filter, 
  IndianRupee, 
  Percent, 
  Search, 
  ShieldCheck, 
  Store, 
  TrendingUp, 
  XCircle 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, txnLabel, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { DateRangePicker } from "@/features/admin/DateRangePicker";
import { Flash, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { TxnRow } from "@/features/admin/types";

type TxnType = { type: string; label: string };

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStart() {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

const FALLBACK_TYPES: TxnType[] = [
  { type: "ALL", label: "All rails" },
  { type: "WALLET", label: "Wallet Transfers" },
  { type: "DMT", label: "Domestic Money Transfer (DMT)" },
  { type: "CASHOUT_UPI", label: "UPI Instant Cashout" },
  { type: "BBPS", label: "BBPS Utility Bills" },
  { type: "AEPS", label: "AePS Biometric ATM" },
];

export default function TransactionsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [types, setTypes] = useState<TxnType[]>(FALLBACK_TYPES);
  const [txnType, setTxnType] = useState("ALL");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [rows, setRows] = useState<TxnRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<TxnType[]>("/api/v1/admin/transactions/types", { token })
      .then((list) => {
        if (list.length) {
          setTypes([{ type: "ALL", label: "All rails" }, ...list]);
        }
      })
      .catch(() => {});
  }, [token]);

  async function loadTransactions() {
    if (!token || !from || !to) return;
    setLoading(true);
    try {
      const typeParam = txnType === "ALL" ? "" : `&txnType=${encodeURIComponent(txnType)}`;
      const data = await api<TxnRow[]>(
        `/api/v1/admin/transactions?from=${from}&to=${to}${typeParam}`,
        { token },
      );
      setRows(Array.isArray(data) ? data : []);
      flash.clear();
    } catch (err) {
      flash.fail(err, "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [token, txnType, from, to]);

  function copy(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalGmv = 0;
    let totalFees = 0;
    let successCount = 0;
    let failedCount = 0;

    const list = rows || [];
    for (const r of list) {
      const amt = Number(r.amount) || 0;
      const fee = Number(r.fee) || 0;
      totalGmv += amt;
      totalFees += fee;
      if (r.state === "SUCCESS" || r.state === "COMPLETED") successCount++;
      if (r.state === "FAILED" || r.state === "REJECTED") failedCount++;
    }

    const rate = list.length > 0 ? Math.round((successCount / list.length) * 100) : 100;
    return { totalGmv, totalFees, successCount, failedCount, rate };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.state !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          (r.agent_name && r.agent_name.toLowerCase().includes(q)) ||
          r.txn_type.toLowerCase().includes(q) ||
          (r.partner_ref && r.partner_ref.toLowerCase().includes(q)) ||
          String(r.amount).includes(q)
        );
      }
      return true;
    });
  }, [rows, statusFilter, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Platform Master Ledger
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Transactions & Settlements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Realtime double-entry clearing ledger across all network agents, distributors, and banking switches.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Clearing Volume"
          value={inr(metrics.totalGmv)}
          hint={`${rows?.length ?? 0} settled transactions`}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Platform Fee Revenue"
          value={inr(metrics.totalFees)}
          hint="Gross margin retained"
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard
          label="Settlement Success %"
          value={`${metrics.rate}%`}
          hint={`${metrics.successCount} successful`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Failed / Reversed"
          value={String(metrics.failedCount)}
          hint="Logged in exception queue"
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filters & Range Picker */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Quick Rail Filters */}
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setTxnType(t.type)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  txnType === t.type
                    ? "bg-navy-950 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

          <div className="relative min-w-[18rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Agent, Ref, UTR, or Amount..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            body={query || statusFilter !== "ALL" ? "Try clearing search filters or broadening the date window." : "Select a rail and date range to view ledger entries."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Transaction / UTR</th>
                  <th className="px-6 py-4">Counter / Agent</th>
                  <th className="px-6 py-4">Rail</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Fee</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-navy-950">
                            {t.id.slice(0, 12)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(t.id)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-700"
                            title="Copy ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        {t.partner_ref && (
                          <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                            Ref: {t.partner_ref}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0">
                          <Store className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-xs sm:text-sm">
                            {t.agent_name ?? "Platform Retailer"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 uppercase">
                        {t.txn_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={t.state} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {t.created_at ? when(t.created_at) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-display font-bold text-navy-950 text-base">
                        {inr(t.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-emerald-700 font-semibold">
                      +{inr(t.fee)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/transactions/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Inspect
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
