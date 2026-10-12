"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Layers, Store, Users } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession, isSuperAdminOrPlatformAdmin } from "@/stores/session.store";
import { Alert, EmptyState, StatCard, StatusPill } from "@/components/ui/primitives";
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
    if (isSuperAdminOrPlatformAdmin(userType)) {
      router.replace("/admin/analytics");
      return;
    }
    if (!token || (userType !== "ADMIN" && userType !== "HUBADMIN")) return;
    api<Dashboard>("/api/v1/admin/hub-dashboard", { token })
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch((e) => setError(formatApiError(e, "Could not load your dashboard")));
  }, [router, token, userType]);

  if (!data && !error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-36 rounded-[2.5rem] animate-pulse bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-3xl animate-pulse bg-slate-100" />
          ))}
        </div>
        <div className="h-64 rounded-3xl animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (error || !data) {
    return <Alert tone="error">{error}</Alert>;
  }

  const t = data.totals;
  const network = data.network ?? t;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Card */}
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

      {/* 2. Counter Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Hubs"
          value={String(n(network.hubs ?? t.hubs))}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Distributors"
          value={String(n(network.distributors ?? t.distributors))}
          hint={`${n(network.distributors_active ?? t.distributors_active)} active`}
          icon={<Layers className="h-5 w-5" />}
        />
        <StatCard
          label="Retail Outlets"
          value={String(n(network.retailers ?? t.retailers))}
          hint={`${n(network.retailers_active ?? t.retailers_active)} active`}
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Customers"
          value={String(n(network.customers ?? t.customers))}
          hint={`${n(t.customers_ekyc)} eKYC`}
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      {/* 3. Hub Operations */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Hub Operations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed performance metrics per hub across your assigned territory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/distributors"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy-950 transition-colors"
            >
              Manage Distributors
            </Link>
            <Link
              href="/admin/retailers"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy-950 transition-colors"
            >
              Manage Retailers
            </Link>
          </div>
        </div>

        {data.hubs.length === 0 ? (
          <EmptyState title="No hubs assigned" body="Ask a super admin to assign you to a hub." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Hub Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Distributors</th>
                  <th className="px-6 py-4">Retailers</th>
                  <th className="px-6 py-4">Customers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.hubs.map((h) => (
                  <tr key={h.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4 font-semibold text-navy-950">{h.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {h.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {[h.city, h.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={h.status ?? "—"} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-navy-950">{n(h.distributors)}</span>
                        <span className="text-[10px] text-slate-400">{n(h.distributors_active)} active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-navy-950">{n(h.retailers)}</span>
                        <span className="text-[10px] text-slate-400">{n(h.retailers_active)} active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-navy-950">{n(h.customers)}</span>
                        <span className="text-[10px] text-slate-400">{n(h.customers_ekyc)} eKYC</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Link
            href="/admin/reports"
            className="text-xs font-bold text-navy-900 hover:text-emerald-700 transition inline-flex items-center gap-1"
          >
            <span>View full reports &amp; analytics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
