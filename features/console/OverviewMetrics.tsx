"use client";

import { useState, type ReactNode } from "react";
import { CreditCard, Percent } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/primitives";
import { inr } from "@/lib/format";
import {
  EarningsTrendChart,
  RangeToggle,
  SalesTrendChart,
  windowHint,
  type EarningsTrendPoint,
  type SalesTrendPoint,
  type TrendRange,
} from "@/features/admin/TrendCharts";

export type NetworkCounts = {
  hubs?: number;
  distributors?: number;
  distributors_active?: number;
  retailers?: number;
  retailers_active?: number;
  customers?: number;
};

export type SalesHeadline = {
  created_today: number;
  created_week: number;
  created_month: number;
  created_all: number;
  activated_today: number;
  activated_week: number;
  activated_month: number;
  activated_all: number;
};

export type EarningsHeadline = {
  today: number;
  week: number;
  month: number;
  all_time: number;
  retailer?: number;
  distributor?: number;
  platform?: number;
};

export type OverviewSnapshot = {
  network?: NetworkCounts;
  sales?: SalesHeadline;
  earnings?: EarningsHeadline;
  you?: EarningsHeadline;
  salesTrends?: { daily: SalesTrendPoint[]; weekly: SalesTrendPoint[]; monthly: SalesTrendPoint[] };
  earningsTrends?: { daily: EarningsTrendPoint[]; weekly: EarningsTrendPoint[]; monthly: EarningsTrendPoint[] };
};

export type OverviewCard = { label: string; value: string; hint?: string; icon?: ReactNode };

export function n(value: number | undefined) {
  return Number(value ?? 0);
}

export function OverviewMetrics({
  title,
  description,
  actions,
  lead,
  network,
  snapshot,
  earningsMode = "network",
  fourth,
  earningsCaption,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  lead?: ReactNode;
  network: OverviewCard[];
  snapshot: OverviewSnapshot;
  earningsMode?: "network" | "you";
  fourth: OverviewCard;
  earningsCaption: string;
  children?: ReactNode;
}) {
  const [range, setRange] = useState<TrendRange>("daily");
  const sales = snapshot.sales;
  const cardEarnings = earningsMode === "you" ? snapshot.you : snapshot.earnings;
  const chartEarnings = snapshot.earnings;
  const salesPoints = snapshot.salesTrends?.[range] ?? [];
  const earningsPoints = snapshot.earningsTrends?.[range] ?? [];
  const salesHeadline = range === "daily" ? n(sales?.created_today) : range === "weekly" ? n(sales?.created_week) : n(sales?.created_month);
  const activatedHeadline = range === "daily" ? n(sales?.activated_today) : range === "weekly" ? n(sales?.activated_week) : n(sales?.activated_month);
  const earningsHeadline = range === "daily" ? n(chartEarnings?.today) : range === "weekly" ? n(chartEarnings?.week) : n(chartEarnings?.month);
  const periodHint = range === "daily" ? "today" : range === "weekly" ? "this week" : "this month";

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} actions={actions} />
      {lead}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {network.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} hint={card.hint} icon={card.icon} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sales this month"
          value={String(n(sales?.created_month))}
          hint={`${n(sales?.created_today)} today`}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          label="Activated this month"
          value={String(n(sales?.activated_month))}
          hint={`${n(sales?.activated_today)} today`}
        />
        <StatCard
          label="Earnings this month"
          value={inr(cardEarnings?.month)}
          hint={`${inr(cardEarnings?.today)} today`}
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard label={fourth.label} value={fourth.value} hint={fourth.hint} icon={fourth.icon} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-xl text-navy-950">Sales and earnings</h3>
            <p className="text-sm text-navy-500">{windowHint(range)} · IST</p>
          </div>
          <RangeToggle range={range} onRange={setRange} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">Sales</p>
                <p className="text-xs text-navy-500">{periodHint} · {activatedHeadline} activated</p>
              </div>
              <p className="font-display text-xl text-navy-950">{salesHeadline}</p>
            </div>
            <SalesTrendChart points={salesPoints} range={range} />
          </article>
          <article className="card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">Earnings</p>
                <p className="text-xs text-navy-500">{periodHint} · {earningsCaption}</p>
              </div>
              <p className="font-display text-xl text-navy-950">{inr(earningsHeadline)}</p>
            </div>
            <EarningsTrendChart points={earningsPoints} range={range} />
          </article>
        </div>
      </section>

      {children}
    </div>
  );
}
