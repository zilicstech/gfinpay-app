"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
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
  const showHubFilter = userType === "SUPER_ADMIN" && hubOptions.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Earnings"
        description="Commission paid by role for the selected dates. Filter by hub, distributor, or retailer."
        actions={
          <button className="btn-secondary inline-flex items-center gap-2" type="button" onClick={openFilters}>
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
        }
      />

      <div className="card flex flex-wrap items-end gap-3">
        <DateRangePicker
          from={from}
          to={to}
          onChange={(nextFrom, nextTo) => {
            setFrom(nextFrom);
            setTo(nextTo);
          }}
        />
        {loading && <p className="text-sm text-navy-500">Loading…</p>}
      </div>

      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={inr(result.totals.all)} />
          <StatCard label="Retailer" value={inr(result.totals.retailer)} />
          <StatCard label="Distributor" value={inr(result.totals.distributor)} />
          <StatCard label="Platform" value={inr(result.totals.platform)} />
        </div>
      )}

      <Flash message={flash.message} error={flash.error} />

      {!result?.rows?.length && !loading ? (
        <EmptyState title="No earnings in this range" body="Try another date range or clear filters." />
      ) : result?.rows?.length ? (
        <>
          {result.truncated && (
            <p className="text-sm text-amber-800">Showing the first 10,000 rows. Narrow the date range to see everything.</p>
          )}
          <DataTable
            columns={["When", "Type", "Role", "Amount", "Retailer", "Distributor", "Hub", "Paid to"]}
            rows={result.rows.map((row) => [
              when(row.created_at),
              row.txn_type?.replaceAll("_", " ") ?? "—",
              row.role_in_split,
              inr(row.amount),
              row.retailer_name ?? "—",
              row.distributor_name ?? "—",
              row.hub_name ?? "—",
              row.beneficiary_name ?? "—",
            ])}
          />
        </>
      ) : null}

      <FormModal open={open} title="Filter earnings" onClose={() => setOpen(false)} onSubmit={applyFilters} submitLabel="Apply">
        {showHubFilter && (
          <SelectField
            label="Hub"
            value={draft.hubId}
            onChange={(v) => setDraft({ hubId: v, distributorId: "", retailerId: "" })}
            options={[{ value: "", label: "All hubs" }, ...hubOptions.map((h) => ({ value: h.id, label: h.name }))]}
          />
        )}
        <SelectField
          label="Distributor"
          value={draft.distributorId}
          onChange={(v) => setDraft({ ...draft, distributorId: v, retailerId: "" })}
          options={[
            { value: "", label: "All distributors" },
            ...distributors.map((d) => ({ value: d.id, label: d.full_name })),
          ]}
        />
        <SelectField
          label="Retailer"
          value={draft.retailerId}
          onChange={(v) => setDraft({ ...draft, retailerId: v })}
          options={[
            { value: "", label: "All retailers" },
            ...retailers.map((r) => ({ value: r.id, label: r.full_name })),
          ]}
        />
      </FormModal>
    </div>
  );
}
