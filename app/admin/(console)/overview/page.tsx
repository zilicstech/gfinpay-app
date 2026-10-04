"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Store, Users, UserRound, ArrowRight, ShieldCheck, Activity, BarChart4 } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession, isSuperAdmin } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { n, type OverviewSnapshot } from "@/features/console/OverviewMetrics";

type HubRow = {
  id: string;
  code: string;
  name: string;
  city?: string;
  state?: string;
  status?: string;
  distributors?: number;
  distributors_active?: number;
  retailers?: number;
  retailers_active?: number;
  customers?: number;
  customers_ekyc?: number;
  wallet_float?: number;
  gmv?: number;
  sales?: number;
};

type Totals = {
  hubs: number;
  distributors: number;
  distributors_active: number;
  retailers: number;
  retailers_active: number;
  customers: number;
  customers_ekyc: number;
};

type Dashboard = OverviewSnapshot & { totals: Totals; hubs: HubRow[] };

export default function HubAdminOverviewPage() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const userType = user?.userType;
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin(userType)) {
      router.replace("/admin/analytics");
      return;
    }
    if (!token || userType !== "ADMIN") return;
    api<Dashboard>("/api/v1/admin/hub-dashboard", { token })
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch((e) => setError(formatApiError(e, "Could not load your dashboard")));
  }, [router, token, userType]);

  if (!data && !error) {
    return (
      <div className="grid gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-[2rem] animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <Alert tone="error">{error}</Alert>;
  }

  const t = data.totals;
  const network = data.network ?? t;

  return (
    <div className="space-y-10">
      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-emerald-400 font-bold tracking-wider text-xs sm:text-sm mb-1 uppercase">
            Welcome Back
          </p>
          <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight">
            Hello, {user?.fullName || "Operations Admin"}
          </h1>
        </div>
      </section>

      {/* Network Scale Grid */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            <h2 className="text-2xl font-bold text-navy-950">Network Scale</h2>
            <p className="text-slate-500 text-sm mt-1">Live metrics across your assigned territory.</p>
          </div>
          <Link href="/admin/reports" className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-500 text-sm bg-indigo-50 px-4 py-2 rounded-full">
            <BarChart4 className="w-4 h-4" /> Full Analytics
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Hubs", value: String(n(network.hubs ?? t.hubs)), hint: "Geographies under management", icon: Building2 },
            { label: "Distributors", value: String(n(network.distributors ?? t.distributors)), hint: `${n(network.distributors_active ?? t.distributors_active)} currently active`, icon: Users },
            { label: "Retail Outlets", value: String(n(network.retailers ?? t.retailers)), hint: `${n(network.retailers_active ?? t.retailers_active)} transacting`, icon: Store },
            { label: "End Customers", value: String(n(network.customers ?? t.customers)), hint: `${n(t.customers_ekyc)} eKYC completed`, icon: UserRound },
          ].map((card, i) => (
            <div key={i} className="group relative bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-emerald-600 flex items-center justify-center mb-6 ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                <card.icon className="w-6 h-6 transition-colors duration-300" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{card.label}</p>
              <p className="text-4xl font-display font-bold text-navy-950 mb-3">{card.value}</p>
              <p className="text-sm font-medium text-slate-500 bg-slate-50 inline-block px-3 py-1 rounded-lg">{card.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hub Data Table Section */}
      <section className="bg-white rounded-[3rem] border border-slate-200/80 shadow-sm p-2 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 px-4 sm:px-0">
          <div>
            <h2 className="text-2xl font-bold text-navy-950">Hub Operations</h2>
            <p className="text-slate-500 text-sm mt-1">Detailed performance metrics per hub.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/admin/distributors" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-800 transition-colors">Manage Distributors</Link>
            <Link href="/admin/retailers" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-800 transition-colors">Manage Retailers</Link>
          </div>
        </div>
        
        {data.hubs.length === 0 ? (
          <EmptyState title="No hubs assigned" body="Ask a super admin to assign you to a hub." />
        ) : (
          <DataTable
            columns={["Hub Name", "Code", "Location", "Status", "Distributors", "Retailers", "Customers", "Total Wallet Float", "GMV"]}
            rows={data.hubs.map((h) => [
              <span key={`${h.id}-name`} className="font-bold text-navy-950">{h.name}</span>,
              <span key={`${h.id}-code`} className="font-mono text-sm tracking-wide bg-slate-100 px-2 py-0.5 rounded text-slate-600">{h.code}</span>,
              <span key={`${h.id}-loc`} className="text-slate-500 font-medium">{[h.city, h.state].filter(Boolean).join(", ") || "—"}</span>,
              <StatusPill key={`${h.id}-st`} value={h.status ?? "—"} />,
              <div key={`${h.id}-d`} className="flex flex-col"><span className="font-bold">{n(h.distributors)}</span><span className="text-[10px] text-slate-400 uppercase">{n(h.distributors_active)} active</span></div>,
              <div key={`${h.id}-r`} className="flex flex-col"><span className="font-bold">{n(h.retailers)}</span><span className="text-[10px] text-slate-400 uppercase">{n(h.retailers_active)} active</span></div>,
              <div key={`${h.id}-c`} className="flex flex-col"><span className="font-bold">{n(h.customers)}</span><span className="text-[10px] text-slate-400 uppercase">{n(h.customers_ekyc)} eKYC</span></div>,
              <span key={`${h.id}-w`} className="font-bold text-emerald-600">{inr(n(h.wallet_float))}</span>,
              <span key={`${h.id}-g`} className="font-bold text-navy-900">{inr(n(h.gmv))}</span>,
            ])}
          />
        )}
      </section>
    </div>
  );
}
