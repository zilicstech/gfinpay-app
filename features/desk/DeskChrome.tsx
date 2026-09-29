"use client";

import Link from "next/link";
import { IndianRupee, Percent, Store, TrendingUp, Users, Wallet } from "lucide-react";
import { DataTable, EmptyState, StatCard, StatusPill } from "@/components/ui/primitives";
import { ViewLink } from "@/features/admin/AdminChrome";
import { dayLabel, inr, pct } from "@/lib/format";
import type { DeskOverview } from "@/features/desk/types";
import type { TxnRow } from "@/features/admin/types";

export function VolumeBars({ points }: { points: { day: string; gmv: number; txn_count: number }[] }) {
  const max = Math.max(...points.map((p) => Number(p.gmv) || 0), 0);
  return (
    <section className="card">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-navy-950">Money sent</p>
          <p className="text-xs text-navy-500">Last 14 days</p>
        </div>
      </div>
      {points.every((p) => !Number(p.gmv)) ? (
        <p className="py-8 text-center text-sm text-navy-500">No successful sends in this window.</p>
      ) : (
        <div className="h-40">
          <div className="flex h-[8.5rem] items-end gap-1 border-b border-navy-900/10">
            {points.map((p) => {
              const value = Number(p.gmv) || 0;
              const h = max > 0 ? Math.max(value > 0 ? 12 : 3, (value / max) * 100) : 3;
              return (
                <div
                  key={String(p.day)}
                  className={`min-w-0 flex-1 rounded-t-md ${value > 0 ? "bg-brand-500/90 hover:bg-brand-600" : "bg-navy-900/15"}`}
                  style={{ height: `${h}%` }}
                  title={`${dayLabel(p.day)} · ${inr(p.gmv)} · ${p.txn_count} txn`}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1">
            {points.map((p) => (
              <span key={`l-${p.day}`} className="hidden min-w-0 flex-1 truncate text-center text-[9px] text-navy-400 sm:block">
                {dayLabel(p.day).split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function OverviewPulse({
  data,
  txnHref,
  showVolumeChart = true,
  showRecentTransactions = true,
}: {
  data: DeskOverview;
  txnHref: (row: TxnRow) => string;
  showVolumeChart?: boolean;
  showRecentTransactions?: boolean;
}) {
  const network = data.scope === "NETWORK";
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sent today" value={inr(data.gmvToday)} hint="Successful sends" icon={<IndianRupee className="h-5 w-5" />} />
        <StatCard label="This month" value={inr(data.gmvMonth)} hint={`${data.txnMonth} transfers`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Success %" value={pct(data.successRateMonth)} hint={`${data.failedCountMonth} failed`} />
        <StatCard label="Your earning" value={inr(data.commissionMonth)} hint={`${inr(data.commissionEarned)} all time`} icon={<Percent className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {network ? (
          <>
            <StatCard label="Retailers" value={String(data.activeOutlets ?? 0)} hint={`${data.outletCount ?? 0} in your area`} icon={<Store className="h-5 w-5" />} />
            <StatCard label="Wallet at retailers" value={inr(data.walletFloat)} hint="Available + on hold" icon={<Wallet className="h-5 w-5" />} />
          </>
        ) : (
          <>
            <StatCard label="Wallet balance" value={inr(data.walletAvailable)} hint={data.walletStatus ?? "Wallet"} icon={<Wallet className="h-5 w-5" />} />
            <StatCard label="On hold" value={inr(data.walletHold)} hint="Sends in progress" />
          </>
        )}
        <StatCard label="Customers" value={String(data.customerCount ?? 0)} hint="Registered at the retailer" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Total sent" value={inr(data.gmvAll)} hint="Successful sends" />
      </div>
      {showVolumeChart && <VolumeBars points={data.gmvByDay ?? []} />}
      {showRecentTransactions && !!data.recentTransactions?.length && (
        <section>
          <h3 className="mb-3 font-display text-xl text-navy-950">Recent transfers</h3>
          <DataTable
            columns={network ? ["When", "Outlet", "Type", "State", "Amount", ""] : ["When", "Type", "State", "Amount", ""]}
            rows={data.recentTransactions.map((t) => {
              const cells = [
                t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—",
                ...(network ? [t.agent_name ?? "—"] : []),
                t.txn_type,
                <StatusPill key={t.id} value={t.state} />,
                inr(t.amount),
                <ViewLink key={`${t.id}-v`} href={txnHref(t)} />,
              ];
              return cells;
            })}
          />
        </section>
      )}
    </>
  );
}

export function TopOutletsTable({
  rows,
}: {
  rows: NonNullable<DeskOverview["topRetailers"]>;
}) {
  if (!rows.length) {
    return <EmptyState title="No retailer volume yet" body="Numbers appear after a retailer completes a successful send." />;
  }
  return (
    <DataTable
      columns={["Retailer", "Name on board", "This month", "Lifetime", "Txns", ""]}
      rows={rows.map((r) => [
        r.full_name,
        r.shop_name ?? "—",
        inr(r.gmv_month),
        inr(r.volume),
        String(r.txn_count),
        <ViewLink key={`${r.id}-v`} href={`/distributor/agents/${r.id}`} />,
      ])}
    />
  );
}

export function AttentionList({ rows }: { rows: NonNullable<DeskOverview["attention"]> }) {
  if (!rows.length) return null;
  return (
    <section>
      <h3 className="mb-3 font-display text-xl text-navy-950">Needs attention</h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-900/10 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-navy-950">{row.full_name}</p>
              <p className="text-xs text-navy-500">{row.reason}</p>
            </div>
            <Link href={`/distributor/agents/${row.id}`} className="text-sm font-semibold text-brand-700">
              Open
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
