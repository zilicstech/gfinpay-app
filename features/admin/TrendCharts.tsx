"use client";

import { activeTillClass } from "@/components/ui/primitives";
import { dayLabel, inr } from "@/lib/format";

export const ANALYTICS_SERVICES = [
  { txnType: "DMT", label: "Send money", bar: "bg-emerald-500" },
  { txnType: "BBPS", label: "Bill pay", bar: "bg-sky-500" },
  { txnType: "RECHARGE", label: "Mobile recharge", bar: "bg-violet-500" },
  { txnType: "DTH", label: "DTH", bar: "bg-orange-500" },
  { txnType: "FASTAG", label: "FASTag", bar: "bg-amber-500" },
  { txnType: "LIC", label: "LIC premium", bar: "bg-rose-500" },
  { txnType: "CASHOUT_UPI", label: "UPI to cash", bar: "bg-cyan-500" },
  { txnType: "CASHOUT_AEPS", label: "Aadhaar cash", bar: "bg-teal-600" },
  { txnType: "FD_CARD_FEE", label: "FD cards", bar: "bg-indigo-500" },
  { txnType: "WALLET_TOPUP", label: "Wallet add", bar: "bg-lime-500" },
] as const;

export type TrendRange = "daily" | "weekly" | "monthly";

export type TrendPoint = {
  period: string;
  txn_type: string;
  amount: number;
  txn_count: number;
};

export type ServiceTotal = {
  txn_type: string;
  today: number;
  week: number;
  month: number;
  all_time: number;
  today_count: number;
  week_count: number;
  month_count: number;
};

function parsePeriod(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(value);
  return new Date(y, m - 1, d);
}

function rangeLabel(period: string, range: TrendRange) {
  const date = parsePeriod(period);
  if (Number.isNaN(date.getTime())) return dayLabel(period);
  if (range === "monthly") return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  if (range === "weekly") return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return date.toLocaleDateString("en-IN", { day: "numeric" });
}

export function ServiceTrendGrid({
  range,
  onRange,
  points,
  totals,
}: {
  range: TrendRange;
  onRange: (r: TrendRange) => void;
  points: TrendPoint[];
  totals: ServiceTotal[];
}) {
  const totalsByType = new Map(totals.map((t) => [t.txn_type, t]));
  const windowHint = range === "daily" ? "Last 14 days" : range === "weekly" ? "Last 12 weeks" : "Last 12 months";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-xl text-navy-950">Service trends</h3>
          <p className="text-sm text-navy-500">{windowHint} · successful transactions · IST</p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f5f5f5] p-1">
          {([
            ["daily", "Daily"],
            ["weekly", "Weekly"],
            ["monthly", "Monthly"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                range === id ? activeTillClass : "text-navy-700"
              }`}
              onClick={() => onRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ANALYTICS_SERVICES.map((svc) => {
          const series = points.filter((p) => p.txn_type === svc.txnType);
          const tot = totalsByType.get(svc.txnType);
          const headline = range === "daily" ? tot?.today : range === "weekly" ? tot?.week : tot?.month;
          const count = range === "daily" ? tot?.today_count : range === "weekly" ? tot?.week_count : tot?.month_count;
          const countHint = range === "daily" ? "today" : range === "weekly" ? "this week" : "this month";
          return (
            <article key={svc.txnType} className="card">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{svc.label}</p>
                  <p className="text-xs text-navy-500">{countHint} · {Number(count ?? 0)} txns</p>
                </div>
                <p className="font-display text-xl text-navy-950">{inr(headline)}</p>
              </div>
              <TrendBars points={series} range={range} barClass={svc.bar} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

export type SalesTrendPoint = {
  period: string;
  created: number;
  activated: number;
};

export type EarningsTrendPoint = {
  period: string;
  amount: number;
  retailer: number;
  distributor: number;
  platform: number;
};

export function RangeToggle({
  range,
  onRange,
}: {
  range: TrendRange;
  onRange: (r: TrendRange) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f5f5f5] p-1">
      {([
        ["daily", "Daily"],
        ["weekly", "Weekly"],
        ["monthly", "Monthly"],
      ] as const).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            range === id ? activeTillClass : "text-navy-700"
          }`}
          onClick={() => onRange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function windowHint(range: TrendRange) {
  return range === "daily" ? "Last 14 days" : range === "weekly" ? "Last 12 weeks" : "Last 12 months";
}

export function SalesTrendChart({ points, range }: { points: SalesTrendPoint[]; range: TrendRange }) {
  const max = Math.max(...points.map((p) => Math.max(Number(p.created) || 0, Number(p.activated) || 0)), 0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold text-navy-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Created</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-navy-800" /> Activated</span>
      </div>
      <div className="flex h-[9.5rem] items-end gap-1 border-b border-navy-900/10">
        {points.map((p) => {
          const created = Number(p.created) || 0;
          const activated = Number(p.activated) || 0;
          const label = rangeLabel(String(p.period), range);
          return (
            <div
              key={String(p.period)}
              className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
              title={`${label} · ${created} created · ${activated} activated`}
            >
              <div className={`w-1/2 max-w-4 rounded-t-md ${created > 0 ? "bg-emerald-500" : "bg-navy-900/15"}`} style={{ height: `${barHeight(created, max)}%` }} />
              <div className={`w-1/2 max-w-4 rounded-t-md ${activated > 0 ? "bg-navy-800" : "bg-navy-900/15"}`} style={{ height: `${barHeight(activated, max)}%` }} />
            </div>
          );
        })}
      </div>
      <PeriodLabels points={points} range={range} />
    </div>
  );
}

export function EarningsTrendChart({ points, range }: { points: EarningsTrendPoint[]; range: TrendRange }) {
  const max = Math.max(...points.map((p) => Number(p.amount) || 0), 0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold text-navy-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Retailer</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-sky-500" /> Distributor</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-navy-900" /> Platform</span>
      </div>
      <div className="flex h-[9.5rem] items-end gap-1 border-b border-navy-900/10">
        {points.map((p) => {
          const retailer = Number(p.retailer) || 0;
          const distributor = Number(p.distributor) || 0;
          const platform = Number(p.platform) || 0;
          const total = Number(p.amount) || retailer + distributor + platform;
          const h = barHeight(total, max);
          const label = rangeLabel(String(p.period), range);
          return (
            <div
              key={String(p.period)}
              className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-md"
              style={{ height: `${h}%` }}
              title={`${label} · ${inr(total)}`}
            >
              {total > 0 ? (
                <>
                  {platform > 0 && <div className="bg-navy-900" style={{ flex: platform }} />}
                  {distributor > 0 && <div className="bg-sky-500" style={{ flex: distributor }} />}
                  {retailer > 0 && <div className="bg-emerald-500" style={{ flex: retailer }} />}
                </>
              ) : (
                <div className="h-full bg-navy-900/15" />
              )}
            </div>
          );
        })}
      </div>
      <PeriodLabels points={points} range={range} />
    </div>
  );
}

function barHeight(value: number, max: number) {
  return max > 0 ? Math.max(value > 0 ? 12 : 3, (value / max) * 100) : 3;
}

function PeriodLabels({ points, range }: { points: { period: string }[]; range: TrendRange }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {points.map((p) => (
        <span key={`l-${p.period}`} className="min-w-0 flex-1 truncate text-center text-[9px] text-navy-400">
          {rangeLabel(String(p.period), range)}
        </span>
      ))}
    </div>
  );
}

function TrendBars({
  points,
  range,
  barClass,
}: {
  points: TrendPoint[];
  range: TrendRange;
  barClass: string;
}) {
  const max = Math.max(...points.map((p) => Number(p.amount) || 0), 0);
  return (
    <div className="h-44">
      <div className="flex h-[9.5rem] items-end gap-1 border-b border-navy-900/10">
        {points.map((p) => {
          const value = Number(p.amount) || 0;
          const h = max > 0 ? Math.max(value > 0 ? 12 : 3, (value / max) * 100) : 3;
          const label = rangeLabel(String(p.period), range);
          return (
            <div
              key={String(p.period)}
              className={`min-w-0 flex-1 rounded-t-md ${value > 0 ? barClass : "bg-navy-900/15"}`}
              style={{ height: `${h}%` }}
              title={`${label} · ${inr(p.amount)} · ${p.txn_count} txn`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {points.map((p) => (
          <span key={`l-${p.period}`} className="min-w-0 flex-1 truncate text-center text-[9px] text-navy-400">
            {rangeLabel(String(p.period), range)}
          </span>
        ))}
      </div>
    </div>
  );
}
