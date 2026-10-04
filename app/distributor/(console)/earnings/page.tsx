"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  IndianRupee, 
  Percent, 
  PieChart, 
  Store, 
  TrendingUp, 
  Wallet 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { DeskEarnings } from "@/features/desk/types";

export default function EarningsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DeskEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api<DeskEarnings>("/api/v1/desk/earnings", { token })
      .then(setData)
      .catch((e) => flash.fail(e, "Failed to load earnings"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Percent className="h-4 w-4" />
              Network Commission Hub
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Distributor Earnings
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Automatic revenue share credited to your float whenever a retailer completes a service or sale.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md min-w-[15rem]">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">This Month's Earnings</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-emerald-400">
              {inr(data?.earnedMonth ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Paid out seamlessly on success</p>
          </div>
        </div>

        {/* Floating Metrics */}
        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">
              {inr(data?.earned ?? 0)}
            </p>
            <p className="mt-1 text-xs text-emerald-400">All-time revenue share</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Counters</span>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-200">
              {data?.byOutlet?.length ?? 0} Outlets
            </p>
            <p className="mt-1 text-xs text-slate-400">Contributing to volume</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Settlement Protocol</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="font-display text-xl font-bold text-emerald-300">T+0 Instant Credit</p>
            </div>
            <p className="mt-1 text-xs text-slate-400">Directly added to float balance</p>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Outlets Breakdown */}
        <div className="lg:col-span-8">
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-navy-950">Earnings by Retailer Outlet</h3>
                <p className="text-xs text-slate-500 mt-0.5">Performance breakdown from your top revenue drivers.</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : !data?.byOutlet || data.byOutlet.length === 0 ? (
              <EmptyState
                title="Waiting for retail volume"
                body="Commissions from your downline retailers will be itemized here as transactions settle."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="px-6 py-4">Outlet Merchant</th>
                      <th className="px-6 py-4 text-right">Your Commission Share</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.byOutlet.map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-slate-50/60 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs shrink-0">
                              <Store className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-navy-950 text-sm">{r.full_name}</p>
                              <span className="text-[11px] text-slate-400">Active Outlet Counter</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-display font-bold text-emerald-700 text-base">
                            +{inr(r.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/distributor/agents/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-navy-950 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            Outlet Profile
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

        {/* Role Split Matrix */}
        <div className="lg:col-span-4">
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">Revenue Split Model</h3>
              <p className="text-xs text-slate-500 mt-0.5">Multi-tiered commission distribution across network roles.</p>
            </div>

            {!data?.byRole?.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Split data logs will appear as transactions complete.
              </div>
            ) : (
              <div className="space-y-3">
                {data.byRole.map((role) => (
                  <div
                    key={role.role_in_split}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Tier Level
                      </span>
                      <p className="font-bold text-navy-950 text-sm">{role.role_in_split.replaceAll("_", " ")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Disbursed
                      </span>
                      <p className="font-display font-bold text-navy-950 text-base">{inr(role.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-500/20 p-4 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Zero Settlement Delay
              </p>
              <p className="text-emerald-800">
                All platform splits are processed atomically through our double-entry ledger engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
