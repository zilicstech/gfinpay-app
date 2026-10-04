"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, CreditCard, Landmark, UserRound, Wallet, Zap, ShieldCheck, Activity, ArrowUpRight, Banknote } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { useDeskServices } from "@/features/desk/DeskServices";
import type { DeskOverview } from "@/features/desk/types";
import { filterQuickTiles } from "@/features/desk/retailer-services";
import { OverviewSnapshot } from "@/features/console/OverviewMetrics";

type RetailerOverview = DeskOverview & OverviewSnapshot;

const TILE_ICONS: Record<string, typeof ArrowLeftRight> = {
  DMT: ArrowLeftRight,
  BBPS: Zap,
  UPI_CASHOUT: Landmark,
  AEPS: Landmark,
  LEAD_GEN: CreditCard,
  FD_MODULE: CreditCard,
};

export default function AgentDashboard() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const { codes, fdProviders } = useDeskServices();
  const flash = useFlash();
  const [data, setData] = useState<RetailerOverview | null>(null);

  useEffect(() => {
    if (!token) return;
    api<RetailerOverview>("/api/v1/desk/overview", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load overview"));
  }, [token]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-3xl animate-pulse bg-slate-100" />)}
        </div>
      </div>
    );
  }

  const tiles = filterQuickTiles(codes, fdProviders);

  return (
    <div className="space-y-8">
      <Flash message={flash.message} error={flash.error} />

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-8 sm:p-12 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-rose-400 font-bold tracking-wider text-sm mb-2 uppercase">Welcome Back</p>
            <h1 className="text-4xl font-display text-white tracking-tight mb-2">Hello, {user?.fullName}</h1>
            <p className="text-slate-400">Your digital store is live. You have completed {data.sales?.created_all || 0} transactions all time.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[140px]">
              <p className="text-white/60 text-xs font-semibold uppercase">Wallet Float</p>
              <p className="text-2xl font-bold text-white mt-1">{inr(data.walletAvailable)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[140px]">
              <p className="text-white/60 text-xs font-semibold uppercase">Earnings (MTD)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{inr(data.you?.month ?? data.commissionMonth)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-950">Quick Services</h2>
          <span className="text-sm font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Live Services: {tiles.length}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiles.map((a) => {
            const Icon = TILE_ICONS[a.code] ?? ArrowLeftRight;
            return (
              <Link key={a.code} href={a.href} className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 text-emerald-600 ring-1 ring-inset ring-slate-100 flex items-center justify-center mb-4 transform transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white shadow-sm group-hover:shadow-lg group-hover:shadow-emerald-500/20">
                  <Icon className="w-6 h-6 transition-colors duration-300" />
                </div>
                <p className="relative z-10 text-sm font-bold text-navy-950 leading-tight">{a.label}</p>
                <p className="relative z-10 text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wider">{a.hint}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Performance Overview */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-slate-200/80 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-navy-950">Performance Overview</h2>
            <Link href="/agent/reports" className="text-sm font-bold text-rose-600 hover:text-rose-500 flex items-center gap-1">
              View Detailed Reports <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <UserRound className="w-5 h-5 transition-colors duration-300" />
              </div>
              <p className="text-slate-500 text-sm font-semibold uppercase">Customers Served</p>
              <p className="text-3xl font-display font-bold text-navy-950 mt-1">{data.network?.customers ?? data.customerCount ?? 0}</p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">+12% from last month</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <Banknote className="w-5 h-5 transition-colors duration-300" />
              </div>
              <p className="text-slate-500 text-sm font-semibold uppercase">Total Sales Value</p>
              <p className="text-3xl font-display font-bold text-navy-950 mt-1">{inr(data.earnings?.all_time ?? 0)}</p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">All time volume generated</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-navy-950 border border-slate-800 p-8 shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full" />
          <h2 className="text-xl font-bold mb-8 relative z-10">Wallet Status</h2>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Available Float</p>
              <p className="text-4xl font-display font-bold text-emerald-400">{inr(data.walletAvailable)}</p>
            </div>
            
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Funds on Hold</p>
              <p className="text-2xl font-display font-bold text-amber-400">{inr(data.walletHold)}</p>
              <p className="text-xs text-slate-500 mt-1">Pending settlements</p>
            </div>
            
            <Link href="/agent/wallet" className="block w-full py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl text-center font-bold text-sm mt-4 border border-white/5 backdrop-blur-sm">
              Manage Wallet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
