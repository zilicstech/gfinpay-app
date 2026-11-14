"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Store,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import type { DeskEarnings } from "@/features/desk/types";

export default function EarningsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [data, setData] = useState<DeskEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "EARNING" | "ZERO">("ALL");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api<DeskEarnings>("/api/v1/desk/earnings", { token })
      .then(setData)
      .catch((e) => flash.fail(e, "Failed to load earnings"))
      .finally(() => setLoading(false));
  }, [token]);

  const outlets = data?.byOutlet ?? [];

  const filteredOutlets = useMemo(() => {
    return outlets.filter((r) => {
      const amt = Number(r.amount) || 0;
      if (filterTab === "EARNING" && amt <= 0) return false;
      if (filterTab === "ZERO" && amt > 0) return false;
      if (query) {
        const q = query.toLowerCase();
        return r.full_name.toLowerCase().includes(q) || String(r.amount).includes(q);
      }
      return true;
    });
  }, [outlets, filterTab, query]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Network Commission Hub
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Distributor Earnings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Automatic revenue share credited to your float whenever a retailer completes a service or sale.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            This Month&apos;s Earnings
          </p>
          <p className="mt-0.5 font-display text-2xl font-extrabold text-emerald-600">
            {inr(data?.earnedMonth ?? 0)}
          </p>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Outlets"],
              ["EARNING", "With Earnings"],
              ["ZERO", "No Earnings Yet"],
            ] as const).map(([key, label]) => {
              const isActive = filterTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterTab(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-navy-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {label}
                  {isActive && ` (${filteredOutlets.length})`}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Retailer or Amount..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredOutlets.length === 0 ? (
          <EmptyState
            title="No outlets match your search"
            body={
              query || filterTab !== "ALL"
                ? "Try clearing search or status filters."
                : "Commissions from your downline retailers will be itemized here as transactions settle."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Outlet / Retailer</th>
                  <th className="px-6 py-4 text-right">Your Commission Share</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOutlets.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                          <Store className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{r.full_name}</p>
                          <span className="font-mono text-[11px] text-slate-400">Retailer Counter</span>
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Details
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
  );
}
