"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, UserRound, Users, Wallet, Target, Activity, MapPin } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { AttentionList, TopOutletsTable } from "@/features/desk/DeskChrome";
import type { DeskOverview } from "@/features/desk/types";
import { n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

type DistributorOverview = DeskOverview & OverviewSnapshot;

export default function DistributorOverviewPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DistributorOverview | null>(null);

  useEffect(() => {
    if (token) {
      api<DistributorOverview>("/api/v1/desk/overview", { token }).then(setData).catch((e) => flash.fail(e, "Failed to load overview"));
    }
  }, [token]);

  if (!data) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-[2rem] animate-pulse bg-slate-100" />)}
      </div>
    );
  }

  const network = data.network;

  return (
    <div className="space-y-10">
      <Flash message={flash.message} error={flash.error} />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-navy-950 p-8 sm:p-12 shadow-2xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 ring-1 ring-inset ring-teal-500/20 mb-6">
              <MapPin className="w-4 h-4" /> Territory Master
            </div>
            <h1 className="text-4xl sm:text-5xl font-display text-white tracking-tight mb-4">Distributor Console</h1>
            <p className="text-lg text-slate-400">Manage your region. You have {n(network?.retailers ?? data.outletCount)} retailers operating and {data.pendingKyc ?? data.attention?.length ?? 0} outlets requiring immediate attention.</p>
            <div className="mt-8 flex gap-4">
              <Link href="/distributor/agents?onboard=1" className="inline-flex items-center justify-center rounded-2xl bg-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400 transition-colors">
                + Onboard New Retailer
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 min-w-[160px]">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Your Earnings (MTD)</p>
              <p className="text-3xl font-display font-bold text-teal-400 mt-2">{inr(data.you?.month ?? data.commissionMonth)}</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/50 uppercase">All time</span>
                <p className="text-white text-sm font-medium">{inr(data.you?.all_time ?? data.commissionEarned)}</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 min-w-[160px]">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Retailer Float</p>
              <p className="text-3xl font-display font-bold text-white mt-2">{inr(data.walletFloat)}</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/50 uppercase">Network Volume</span>
                <p className="text-white text-sm font-medium">{inr(data.earnings?.all_time)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Active Retailers", value: String(n(network?.retailers ?? data.outletCount)), hint: `${n(network?.retailers_active ?? data.activeOutlets)} transacting this week`, icon: Store },
          { label: "End Customers", value: String(n(network?.customers ?? data.customerCount)), hint: "Total reach via your network", icon: UserRound },
          { label: "Needs Attention", value: String(data.pendingKyc ?? data.attention?.length ?? 0), hint: "Pending KYC or low float", icon: Target },
        ].map((card, i) => (
          <div key={i} className="group bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{card.label}</p>
                <p className="text-4xl font-display font-bold text-navy-950 mb-3">{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-emerald-600 flex items-center justify-center ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <card.icon className="w-6 h-6 transition-colors duration-300" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 bg-slate-50 inline-block px-3 py-1 rounded-lg mt-2">{card.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-navy-950">Top Retailers</h3>
              <p className="text-sm text-slate-500 mt-1">Highest performing outlets this month</p>
            </div>
            <Link href="/distributor/agents" className="text-sm font-bold text-teal-600 hover:text-teal-500 bg-teal-50 px-4 py-2 rounded-xl">View All</Link>
          </div>
          <TopOutletsTable rows={data.topRetailers ?? []} />
        </section>

        <section>
          <AttentionList rows={data.attention ?? []} />
        </section>
      </div>
    </div>
  );
}
