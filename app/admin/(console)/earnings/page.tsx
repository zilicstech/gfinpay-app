"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { 
  Building2, 
  Download, 
  IndianRupee, 
  Percent, 
  PieChart, 
  SlidersHorizontal, 
  Store, 
  TrendingUp, 
  Users, 
  Wallet 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { DateRangePicker } from "@/features/admin/DateRangePicker";
import { Flash, FormModal, SelectField, useFlash } from "@/features/admin/AdminChrome";

type Party = { id: string; full_name: string; code?: string; parent_id?: string; hub_id?: string };
type HubOpt = { id: string; name: string; code?: string };

type Filters = {
  retailers: Party[];
  distributors: Party[];
  hubs: HubOpt[];
};

type EarningRow = {
  id: string;
  created_at?: string;
  amount: number;
  role_in_split: string;
  txn_type?: string;
  retailer_name?: string;
  distributor_name?: string;
  hub_name?: string;
  beneficiary_name?: string;
};

type EarningsResult = {
  from: string;
  to: string;
  totals: { all: number; retailer: number; distributor: number; platform: number };
  rows: EarningRow[];
  truncated?: boolean;
};

type ExtraFilters = {
  hubId: string;
  distributorId: string;
  retailerId: string;
};

const EMPTY_EXTRAS: ExtraFilters = { hubId: "", distributorId: "", retailerId: "" };

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminEarningsPage() {
  const token = useSession((s) => s.token);
  const userType = useSession((s) => s.user?.userType);
  const flash = useFlash();
  const [from, setFrom] = useState(() => isoDate(new Date()));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [filterOptions, setFilterOptions] = useState<Filters | null>(null);
  const [applied, setApplied] = useState<ExtraFilters>(EMPTY_EXTRAS);
  const [draft, setDraft] = useState<ExtraFilters>(EMPTY_EXTRAS);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<EarningsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !from || !to) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (applied.hubId) params.set("hubId", applied.hubId);
      if (applied.distributorId) params.set("distributorId", applied.distributorId);
      if (applied.retailerId) params.set("retailerId", applied.retailerId);
      const data = await api<EarningsResult>(`/api/v1/admin/earnings?${params}`, { token });
      setResult(data);
      flash.clear();
    } catch (err) {
      flash.fail(err, "Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [token, from, to, applied]);

  useEffect(() => {
    if (!token) return;
    api<Filters>("/api/v1/admin/earnings/filters", { token })
      .then(setFilterOptions)
      .catch((e) => flash.fail(e, "Failed to load filters"));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openFilters() {
    setDraft(applied);
    setOpen(true);
  }

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    setApplied(draft);
    setOpen(false);
  }

  const distributors = useMemo(() => {
    const all = filterOptions?.distributors ?? [];
    if (!draft.hubId) return all;
    return all.filter((d) => d.hub_id === draft.hubId);
  }, [filterOptions, draft.hubId]);

  const retailers = useMemo(() => {
    let all = filterOptions?.retailers ?? [];
    if (draft.hubId) all = all.filter((r) => r.hub_id === draft.hubId);
    if (draft.distributorId) all = all.filter((r) => r.parent_id === draft.distributorId);
    return all;
  }, [filterOptions, draft.hubId, draft.distributorId]);

  const hubOptions = filterOptions?.hubs ?? [];
  const showHubFilter = (userType === "SUPER_ADMIN" || userType === "ADMIN") && hubOptions.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Clearing & Disbursals
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Platform Earnings & Splits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit revenue sharing between Retailers, Distributors, and Platform Margins across selected dates.
          </p>
        </div>

        <button
          className="btn-secondary inline-flex items-center gap-2 rounded-2xl"
          type="button"
          onClick={openFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter by Territory / Role
        </button>
      </div>

      {/* Date Range Selector Card */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Settlement Period</span>
          <p className="text-sm font-semibold text-navy-950 mt-0.5">Select settlement window to calculate ledger splits</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            from={from}
            to={to}
            onChange={(nextFrom, nextTo) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
          {loading && <span className="text-xs font-semibold text-emerald-600 animate-pulse">Calculating…</span>}
        </div>
      </div>

      {/* KPI Cards */}
      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Commission Disbursed"
            value={inr(result.totals.all)}
            hint="Gross platform pool"
            icon={<IndianRupee className="h-5 w-5" />}
          />
          <StatCard
            label="Platform Net Revenue"
            value={inr(result.totals.platform)}
            hint="Retained margin"
            icon={<Percent className="h-5 w-5" />}
          />
          <StatCard
            label="Retailer Counter Share"
            value={inr(result.totals.retailer)}
            hint="Paid to merchants"
            icon={<Store className="h-5 w-5" />}
          />
          <StatCard
            label="Distributor Share"
            value={inr(result.totals.distributor)}
            hint="Franchise commissions"
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      )}

      <Flash message={flash.message} error={flash.error} />

      {/* Master Table */}
      {!result?.rows?.length && !loading ? (
        <EmptyState title="No earnings logged in this window" body="Try widening the date range or clearing specific filters." />
      ) : result?.rows?.length ? (
        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4">Settled When</th>
                <th className="px-6 py-4">Service Rail</th>
                <th className="px-6 py-4">Beneficiary Role</th>
                <th className="px-6 py-4">Paid To</th>
                <th className="px-6 py-4">Outlet / Counter</th>
                <th className="px-6 py-4">Hub Territory</th>
                <th className="px-6 py-4 text-right">Commission Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/60 group">
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {when(row.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-navy-950 text-xs sm:text-sm">
                      {row.txn_type?.replaceAll("_", " ") ?? "Transfer"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill value={row.role_in_split} />
                  </td>
                  <td className="px-6 py-4 font-medium text-navy-950 text-sm">
                    {row.beneficiary_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {row.retailer_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {row.hub_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-display font-bold text-emerald-700 text-base">
                      +{inr(row.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Filter Modal */}
      <FormModal open={open} title="Filter Earnings Ledger" description="Narrow the calculations by geography, distributor, or specific outlet." onClose={() => setOpen(false)} onSubmit={applyFilters} submitLabel="Apply Filter">
        {showHubFilter && (
          <SelectField
            label="Regional Hub"
            value={draft.hubId}
            onChange={(v) => setDraft({ hubId: v, distributorId: "", retailerId: "" })}
            options={[{ value: "", label: "All Hubs" }, ...hubOptions.map((h) => ({ value: h.id, label: h.name }))]}
          />
        )}
        <SelectField
          label="Master Distributor"
          value={draft.distributorId}
          onChange={(v) => setDraft({ ...draft, distributorId: v, retailerId: "" })}
          options={[
            { value: "", label: "All Distributors" },
            ...distributors.map((d) => ({ value: d.id, label: d.full_name })),
          ]}
        />
        <SelectField
          label="Retailer Counter"
          value={draft.retailerId}
          onChange={(v) => setDraft({ ...draft, retailerId: v })}
          options={[
            { value: "", label: "All Retailers" },
            ...retailers.map((r) => ({ value: r.id, label: r.full_name })),
          ]}
        />
      </FormModal>
    </div>
  );
}
