"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatusPill } from "@/components/ui/primitives";
import { DateRangePicker } from "@/features/admin/DateRangePicker";
import { Flash, FormModal, SelectField, useFlash } from "@/features/admin/AdminChrome";
import { productTitle } from "@/features/sales/CatalogShowcase";

type ReportType = { type: string; label: string };
type NamedCode = { code: string; name: string };
type Party = { id: string; full_name: string; code?: string; parent_id?: string; hub_id?: string };
type HubOpt = { id: string; name: string; code?: string };

type Filters = {
  saleTypes: NamedCode[];
  saleProviders: NamedCode[];
  statuses: string[];
  retailers: Party[];
  distributors: Party[];
  hubs: HubOpt[];
};

type SaleRow = {
  id: string;
  state: string;
  sale_type: string;
  sale_type_name?: string;
  sale_provider: string;
  item_name: string;
  item_code?: string;
  customer_name: string;
  customer_mobile?: string;
  retailer_user_id?: string;
  retailer_name?: string;
  distributor_user_id?: string;
  distributor_name?: string;
  hub_id?: string;
  hub_name?: string;
  created_at?: string;
};

type QueryResult = {
  reportType: string;
  label: string;
  from: string;
  to: string;
  total: number;
  truncated?: boolean;
  rows: SaleRow[];
};

type ExtraFilters = {
  saleType: string;
  saleProvider: string;
  status: string;
  hubId: string;
  distributorId: string;
  retailerId: string;
};

const EMPTY_EXTRAS: ExtraFilters = {
  saleType: "",
  saleProvider: "",
  status: "",
  hubId: "",
  distributorId: "",
  retailerId: "",
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStart() {
  const now = new Date();
  return isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export default function ReportsPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [types, setTypes] = useState<ReportType[]>([{ type: "SALES", label: "Sales Report" }]);
  const [reportType, setReportType] = useState("SALES");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [filterOptions, setFilterOptions] = useState<Filters | null>(null);
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<ExtraFilters>(EMPTY_EXTRAS);
  const [draft, setDraft] = useState<ExtraFilters>(EMPTY_EXTRAS);
  const [result, setResult] = useState<QueryResult | null>(null);

  useEffect(() => {
    if (!token) return;
    api<ReportType[]>("/api/v1/admin/reports/types", { token })
      .then((list) => {
        if (list.length) {
          setTypes(list);
          setReportType((cur) => (list.some((t) => t.type === cur) ? cur : list[0].type));
        }
      })
      .catch((e) => flash.fail(e, "Failed to load report types"));
  }, [token]);

  useEffect(() => {
    if (!token || !result) return;
    api<Filters>(`/api/v1/admin/reports/${result.reportType}/filters`, { token })
      .then(setFilterOptions)
      .catch((e) => flash.fail(e, "Failed to load report filters"));
  }, [token, result?.reportType]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!from || !to) {
      flash.fail(new Error("Pick a from and to date"), "Pick a from and to date");
      return;
    }
    try {
      const params = new URLSearchParams({ reportType, from, to });
      const data = await api<QueryResult>(`/api/v1/admin/reports/query?${params}`, { token });
      setApplied(EMPTY_EXTRAS);
      setDraft(EMPTY_EXTRAS);
      setResult(data);
      flash.clear();
    } catch (err) {
      flash.fail(err, "Could not load report");
    }
  }

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

  const rows = useMemo(() => {
    const all = result?.rows ?? [];
    return all.filter((row) => {
      if (applied.saleType && row.sale_type !== applied.saleType) return false;
      if (applied.saleProvider && row.sale_provider !== applied.saleProvider) return false;
      if (applied.status && row.state !== applied.status) return false;
      if (applied.hubId && row.hub_id !== applied.hubId) return false;
      if (applied.distributorId && row.distributor_user_id !== applied.distributorId) return false;
      if (applied.retailerId && row.retailer_user_id !== applied.retailerId) return false;
      return true;
    });
  }, [result, applied]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Platform Audit
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            MIS Reports & Extracts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate granular ledger and sales audit logs across hubs, distributors, and banking partners.
          </p>
        </div>

        {result ? (
          <button
            className="btn-secondary inline-flex items-center gap-2 rounded-2xl"
            type="button"
            onClick={openFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter Rows ({rows.length})
          </button>
        ) : null}
      </div>

      {/* Generator Form Card */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold text-navy-950">Report Query Parameters</h3>
        <form className="flex flex-wrap items-end gap-3 pt-1" onSubmit={generate}>
          <div className="w-full sm:w-[17.5rem]">
            <SelectField
              label="Report Type"
              required
              value={reportType}
              onChange={setReportType}
              options={types.map((t) => ({ value: t.type, label: t.label }))}
            />
          </div>
          <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
          <button className="btn-primary" type="submit" disabled={!from || !to}>
            Generate Report
          </button>
        </form>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* KPI Summary when result is available */}
      {result && result.reportType === "SALES" && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Rows</span>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{rows.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Matching active filters</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Outlets</span>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">
              {new Set(rows.map((r) => r.retailer_user_id).filter(Boolean)).size} Outlets
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Participating in window</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Customers</span>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">
              {new Set(rows.map((r) => r.customer_name).filter(Boolean)).size} Customers
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Activated</span>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-700">
              {rows.filter((r) => r.state === "CONVERTED" || r.state === "ACTIVATED").length} Issued
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Fully converted</p>
          </div>
        </div>
      )}

      {!result && (
        <EmptyState title="No report generated yet" body="Select a report type and date range above, then click Generate Report." />
      )}

      {result && result.reportType === "SALES" && (
        rows.length === 0 ? (
          <EmptyState title="No sales found in this window" body="Widen the date range or clear some of your active filters." />
        ) : (
          <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4">Product & Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Outlet Counter</th>
                  <th className="px-6 py-4">Hub Territory</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {when(row.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-navy-950 text-sm">
                          {productTitle(row.item_code ?? "", row.item_name)}
                        </p>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {row.sale_provider} • {row.sale_type_name ?? row.sale_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={row.state} />
                    </td>
                    <td className="px-6 py-4 font-medium text-navy-950 text-sm">
                      {row.customer_name}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {row.retailer_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {row.hub_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/sales/${row.id}`}
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
        )
      )}

      {result && result.reportType !== "SALES" && (
        <EmptyState title="Report viewer unavailable" body="This specific report type is currently processing in batch mode." />
      )}

      <FormModal
        open={open}
        title="Filter report"
        description="Narrow the rows already generated for this date range."
        onClose={() => setOpen(false)}
        onSubmit={applyFilters}
        submitLabel="Apply"
      >
        <SelectField
          label="Sale type"
          value={draft.saleType}
          onChange={(v) => setDraft((c) => ({ ...c, saleType: v }))}
          placeholder="All types"
          options={(filterOptions?.saleTypes ?? []).map((t) => ({ value: t.code, label: t.name }))}
        />
        <SelectField
          label="Sale provider"
          value={draft.saleProvider}
          onChange={(v) => setDraft((c) => ({ ...c, saleProvider: v }))}
          placeholder="All providers"
          options={(filterOptions?.saleProviders ?? []).map((p) => ({ value: p.code, label: p.name }))}
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(v) => setDraft((c) => ({ ...c, status: v }))}
          placeholder="All statuses"
          options={(filterOptions?.statuses ?? []).map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
        />
        <SelectField
          label="Hub"
          value={draft.hubId}
          onChange={(v) => setDraft((c) => ({ ...c, hubId: v, distributorId: "", retailerId: "" }))}
          placeholder="All hubs"
          options={(filterOptions?.hubs ?? []).map((h) => ({ value: h.id, label: h.name }))}
        />
        <SelectField
          label="Distributor"
          value={draft.distributorId}
          onChange={(v) => setDraft((c) => ({ ...c, distributorId: v, retailerId: "" }))}
          placeholder="All distributors"
          options={distributors.map((d) => ({ value: d.id, label: d.full_name }))}
        />
        <SelectField
          label="Retailer"
          value={draft.retailerId}
          onChange={(v) => setDraft((c) => ({ ...c, retailerId: v }))}
          placeholder="All retailers"
          options={retailers.map((r) => ({ value: r.id, label: r.full_name }))}
        />
      </FormModal>
    </div>
  );
}
