"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Layers, Store, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { StatCard } from "@/components/ui/primitives";
import type { OverviewSnapshot, SalesTrendPoint } from "@/features/console/OverviewMetrics";

type TrendRange = "daily" | "weekly" | "monthly";

function parsePeriod(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(value);
  return new Date(y, m - 1, d);
}

function formatPeriodLabel(period: string, range: TrendRange) {
  const date = parsePeriod(period);
  if (Number.isNaN(date.getTime())) return period;
  if (range === "monthly") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  if (range === "weekly") {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AnalyticsPage() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const [data, setData] = useState<OverviewSnapshot | null>(null);
  const [vendorCount, setVendorCount] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TrendRange>("daily");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api<OverviewSnapshot>("/api/v1/admin/reports/summary", { token }),
      api<any[]>("/api/v1/admin/vendors", { token }).catch(() => []),
    ])
      .then(([summary, vendors]) => {
        setData(summary);
        if (Array.isArray(vendors)) {
          setVendorCount(vendors.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Active trend series based on range selection
  const activePoints: SalesTrendPoint[] = useMemo(() => {
    if (!data?.salesTrends) return [];
    if (activeRange === "daily") return data.salesTrends.daily ?? [];
    if (activeRange === "weekly") return data.salesTrends.weekly ?? [];
    return data.salesTrends.monthly ?? [];
  }, [data?.salesTrends, activeRange]);

  // Range-level aggregations
  const totalCreated = useMemo(
    () => activePoints.reduce((acc, p) => acc + (Number(p.created) || 0), 0),
    [activePoints]
  );
  const totalActivated = useMemo(
    () => activePoints.reduce((acc, p) => acc + (Number(p.activated) || 0), 0),
    [activePoints]
  );
  const conversionRate = useMemo(() => {
    if (!totalCreated) return "0.0";
    return ((totalActivated / totalCreated) * 100).toFixed(1);
  }, [totalCreated, totalActivated]);

  const maxVal = useMemo(
    () =>
      Math.max(
        ...activePoints.map((p) => Math.max(Number(p.created) || 0, Number(p.activated) || 0)),
        1
      ),
    [activePoints]
  );

  const rangeMeta = {
    daily: {
      title: "Daily",
      window: "Last 14 Days",
      hint: "Day-by-day sales leads initiated and activated.",
    },
    weekly: {
      title: "Weekly",
      window: "Last 12 Weeks",
      hint: "Week-over-week applications and completed cards.",
    },
    monthly: {
      title: "Monthly",
      window: "Last 12 Months",
      hint: "Month-by-month sales pipeline and closures.",
    },
  }[activeRange];

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
            Hello, {user?.fullName || "Admin"}
          </h1>
        </div>
      </section>

      {/* 2. Counter Cards (Same design as admin/distributors page) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Hubs"
          value={String(data?.network?.hubs ?? 10)}
          hint="Regional hubs"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Distributors"
          value={String(data?.network?.distributors ?? 3)}
          hint={`${data?.network?.distributors_active ?? 3} active`}
          icon={<Layers className="h-5 w-5" />}
        />
        <StatCard
          label="Retailers"
          value={String(data?.network?.retailers ?? 3)}
          hint={`${data?.network?.retailers_active ?? 3} active`}
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Vendors"
          value={String(data?.network?.vendors ?? vendorCount)}
          hint="Partner desks"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          label="Customers"
          value={String(data?.network?.customers ?? 15)}
          hint="Counter profiles"
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      {/* 3. Sales Trend Charts (Daily, Weekly, Monthly) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Sales Trends</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rangeMeta.window} · {rangeMeta.hint}
            </p>
          </div>

          {/* Minimalist Range Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {(
              [
                ["daily", "Daily"],
                ["weekly", "Weekly"],
                ["monthly", "Monthly"],
              ] as const
            ).map(([rangeKey, label]) => {
              const active = activeRange === rangeKey;
              return (
                <button
                  key={rangeKey}
                  type="button"
                  onClick={() => {
                    setActiveRange(rangeKey);
                    setHoveredIndex(null);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-navy-950 shadow-xs"
                      : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimalist Key Stats */}
        <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-4">
          <div>
            <p className="text-xs text-slate-500">Leads Created</p>
            <p className="mt-1 text-2xl font-bold text-navy-950">{totalCreated}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Sales Activated</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{totalActivated}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Conversion Rate</p>
            <p className="mt-1 text-2xl font-bold text-navy-950">{conversionRate}%</p>
          </div>
        </div>

        {/* Minimalist Trend Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span>Created</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-navy-900" />
                <span>Activated</span>
              </span>
            </div>

            {hoveredIndex !== null && activePoints[hoveredIndex] ? (
              <span className="font-mono text-xs text-navy-950">
                {formatPeriodLabel(activePoints[hoveredIndex].period, activeRange)}:{" "}
                <strong className="text-emerald-600">{activePoints[hoveredIndex].created} created</strong>,{" "}
                <strong>{activePoints[hoveredIndex].activated} activated</strong>
              </span>
            ) : null}
          </div>

          <div className="relative pt-4">
            <div className="flex h-52 items-end gap-1.5 sm:gap-2.5 border-b border-slate-200 pb-1">
              {activePoints.map((p, idx) => {
                const created = Number(p.created) || 0;
                const activated = Number(p.activated) || 0;
                const createdHeight = maxVal > 0 ? Math.max(created > 0 ? (created / maxVal) * 100 : 3, 3) : 3;
                const activatedHeight = maxVal > 0 ? Math.max(activated > 0 ? (activated / maxVal) * 100 : 3, 3) : 3;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={p.period}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 rounded-md p-0.5 transition-all cursor-pointer ${
                      isHovered ? "bg-slate-100" : ""
                    }`}
                  >
                    <div
                      className={`w-1/2 rounded-t-sm transition-all ${
                        created > 0 ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                      style={{ height: `${createdHeight}%` }}
                    />
                    <div
                      className={`w-1/2 rounded-t-sm transition-all ${
                        activated > 0 ? "bg-navy-900" : "bg-slate-200"
                      }`}
                      style={{ height: `${activatedHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex gap-1.5 sm:gap-2.5">
              {activePoints.map((p) => (
                <div key={p.period} className="min-w-0 flex-1 text-center">
                  <span className="block truncate text-[10px] text-slate-500">
                    {formatPeriodLabel(p.period, activeRange)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>



        <div className="flex justify-end pt-2">
          <Link
            href="/admin/sales"
            className="text-xs font-bold text-navy-900 hover:text-emerald-700 transition inline-flex items-center gap-1"
          >
            <span>View all sales leads</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
