"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  CheckCircle2, 
  Coins, 
  DollarSign, 
  Percent, 
  Sparkles, 
  TrendingUp, 
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { VolumeBars } from "@/features/desk/DeskChrome";
import type { DeskEarnings, DeskOverview } from "@/features/desk/types";

export default function AgentReportsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DeskEarnings | null>(null);
  const [overview, setOverview] = useState<DeskOverview | null>(null);

  useEffect(() => {
    if (!token) return;
    api<DeskEarnings>("/api/v1/desk/earnings", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load reports"));
    api<DeskOverview>("/api/v1/desk/overview", { token }).then(setOverview).catch(() => undefined);
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Revenue & Commission Luxury Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                  <Percent className="h-3.5 w-3.5" />
                  Commission Intelligence
                </span>
                <span className="text-xs text-slate-400">Direct Retail Split</span>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Earnings & Revenue Performance
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                Detailed audit of retailer commissions credited across DMT, BBPS, UPI Cashout, and Financial Lead sales.
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md min-w-[220px] text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Credited (MTD)</span>
              <p className="mt-1 font-display text-3xl sm:text-4xl font-black text-white">
                {inr(data?.earnedMonth)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime: {inr(data?.earned)}</span>
            </div>
          </div>
        </div>

        {/* Float & GMV Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">This Month's Split</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-600">{inr(data?.earnedMonth)}</p>
            <p className="mt-0.5 text-xs text-slate-500">Credited directly to wallet till</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Counter GMV (MTD)</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{inr(overview?.gmvMonth)}</p>
            <p className="mt-0.5 text-xs text-slate-500">Gross volume processed</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Health</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{overview?.successRateMonth ?? 100}%</p>
            <p className="mt-0.5 text-xs text-emerald-600 font-semibold">Live clearing rate</p>
          </div>
        </div>
      </section>

      <Flash message={flash.message} error={flash.error} />

      {/* Volume Chart */}
      {overview && (
        <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Daily Volume Trend
            </h2>
            <p className="text-xs text-slate-500 mt-1">Transaction throughput processed at your desk over the last 14 days.</p>
          </div>
          <VolumeBars points={overview.gmvByDay} />
        </section>
      )}

      {/* Breakdown by Service / Role */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-navy-950">Revenue Distribution</h2>
        {!data?.byRole?.length ? (
          <EmptyState title="No commission splits recorded yet" body="Commissions from your counter transactions will appear here once cleared." />
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <DataTable 
              columns={["Clearing Stream / Role", "Credited Amount", "Status"]} 
              rows={data.byRole.map((r, i) => [
                <span key={i} className="font-bold text-navy-950">{r.role_in_split.replaceAll("_", " ")}</span>,
                <span key={`${i}-a`} className="font-mono font-bold text-emerald-600">{inr(r.amount)}</span>,
                <span key={`${i}-s`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Settled
                </span>
              ])} 
            />
          </div>
        )}
      </section>
    </div>
  );
}
