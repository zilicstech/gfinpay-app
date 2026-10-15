"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  ArrowLeftRight, 
  ArrowRight, 
  CreditCard, 
  IndianRupee, 
  Landmark, 
  Users, 
  Wallet, 
  Zap 
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatCard, StatusPill } from "@/components/ui/primitives";
import { useDeskServices } from "@/features/desk/DeskServices";
import type { DeskOverview } from "@/features/desk/types";
import { filterQuickTiles } from "@/features/desk/retailer-services";
import { n, type OverviewSnapshot, type SalesTrendPoint } from "@/features/console/OverviewMetrics";

type TrendRange = "daily" | "weekly" | "monthly";

type RetailerOverview = DeskOverview & OverviewSnapshot;

const TILE_ICONS: Record<string, typeof ArrowLeftRight> = {
  DMT: ArrowLeftRight,
  BBPS: Zap,
  UPI_CASHOUT: Landmark,
  AEPS: Landmark,
  LEAD_GEN: CreditCard,
  FD_MODULE: CreditCard,
};

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

export default function AgentDashboard() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const { codes, fdProviders } = useDeskServices();
  const [data, setData] = useState<RetailerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<TrendRange>("daily");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ kycStatus?: string; bankStatus?: string }>("/api/v1/me/ekyc", { token })
      .then((res) => setKycOpen(res.kycStatus !== "COMPLETED" || res.bankStatus !== "VERIFIED"))
      .catch(() => setKycOpen(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api<RetailerOverview>("/api/v1/desk/overview", { token })
      .then((res) => {
        setData(res);
      })
      .catch((e) => setError(formatApiError(e, "Failed to load dashboard overview")))
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

  const tiles = filterQuickTiles(codes, fdProviders);

  if (loading && !data) {
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
    return <Alert tone="error">{error || "Failed to load dashboard"}</Alert>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-400 font-bold tracking-wider text-xs sm:text-sm mb-1 uppercase">
              Welcome Back
            </p>
            <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight">
              Hello, {user?.fullName || "Partner"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your digital retail desk is live. Manage customer services, monitor counter float, and track transactions.
            </p>
          </div>
          {kycOpen && (
            <Link
              href="/agent/kyc"
              className="shrink-0 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-navy-950"
            >
              Complete KYC
            </Link>
          )}
        </div>
      </section>

      {/* 2. Counter Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available Float"
          value={inr(data.walletAvailable)}
          hint={data.walletHold ? `${inr(data.walletHold)} on hold` : "Counter liquidity"}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Earnings (MTD)"
          value={inr(data.you?.month ?? data.commissionMonth)}
          hint={`${inr(data.you?.all_time ?? data.commissionEarned)} lifetime`}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Customers"
          value={String(n(data.network?.customers ?? data.customerCount ?? 0))}
          hint="Registered at counter"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Sales Volume"
          value={inr(data.earnings?.all_time ?? data.gmvMonth ?? 0)}
          hint={`${data.txnMonth ?? data.sales?.created_all ?? 0} txns completed`}
          icon={<Activity className="h-5 w-5" />}
        />
      </section>

      {/* 3. Quick Services */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Quick Services</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch customer transactions, bill payments, and financial products.
            </p>
          </div>

          <Link
            href="/agent/catalog"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy-950 transition-colors"
          >
            Browse Catalog
          </Link>
        </div>

        {tiles.length === 0 ? (
          <EmptyState
            title="No services active"
            body="Services assigned to your retail desk will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {tiles.map((a) => {
              const Icon = TILE_ICONS[a.code] ?? ArrowLeftRight;
              return (
                <Link
                  key={a.code}
                  href={a.href}
                  className="group relative overflow-hidden rounded-2xl bg-slate-50/70 border border-slate-200/80 p-4 transition-all duration-300 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-500/40 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 ring-1 ring-inset ring-slate-200/80 flex items-center justify-center mb-3 transform transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white shadow-xs">
                    <Icon className="w-6 h-6 transition-colors duration-300" />
                  </div>
                  <p className="text-xs font-bold text-navy-950 leading-tight group-hover:text-emerald-700 transition-colors">
                    {a.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {a.hint}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Recent Transactions */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Recent Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions and customer transfers processed at your counter.
            </p>
          </div>

          <Link
            href="/agent/transactions"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy-950 transition-colors"
          >
            View All Transactions
          </Link>
        </div>

        {!data.recentTransactions || data.recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            body="Your counter transactions will appear here as you serve customers."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">When</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {when(t.created_at)}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-navy-950">
                      {t.txn_type?.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={t.state} />
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-navy-950 text-right">
                      {inr(t.amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/agent/transactions/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-emerald-700 transition"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Sales Trend Charts (Daily, Weekly, Monthly) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Sales Trends</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rangeMeta.window} · {rangeMeta.hint}
            </p>
          </div>

          {/* Range Switcher */}
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

        {/* Key Stats */}
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

        {/* Trend Chart */}
        {activePoints.length === 0 ? (
          <EmptyState
            title="No sales activity yet"
            body="Sales lead conversions and trends will be plotted as your counter generates applications."
          />
        ) : (
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
        )}

        <div className="flex justify-end pt-2">
          <Link
            href="/agent/sales"
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
