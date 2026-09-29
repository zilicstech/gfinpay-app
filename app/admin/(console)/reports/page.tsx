"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
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
      <PageHeader
        eyebrow="Reports"
        title="Reports"
        description="Choose a report and date range to generate it. After that you can filter the rows."
        actions={
          result ? (
            <button className="btn-secondary inline-flex items-center gap-2" type="button" onClick={openFilters}>
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          ) : undefined
        }
      />

      <form className="card flex flex-wrap items-end gap-3" onSubmit={generate}>
        <div className="w-[17.5rem]">
          <SelectField
            label="Report type"
            required
            value={reportType}
            onChange={setReportType}
            options={types.map((t) => ({ value: t.type, label: t.label }))}
          />
        </div>
        <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
        <button className="btn-primary" type="submit" disabled={!from || !to}>
          Generate report
        </button>
      </form>

      <Flash message={flash.message} error={flash.error} />

      {!result && (
        <EmptyState title="No report yet" body="Select a report type and date range, then generate." />
      )}

      {result && result.reportType === "SALES" && (
        rows.length === 0 ? (
          <EmptyState title="No sales in this view" body="Widen the date range or clear a filter." />
        ) : (
          <DataTable
            columns={["When", "Type", "Product", "Provider", "Status", "Customer", "Retailer", "Distributor", "Hub", ""]}
            rows={rows.map((row) => [
              when(row.created_at),
              row.sale_type_name ?? row.sale_type,
              productTitle(row.item_code ?? "", row.item_name),
              row.sale_provider,
              <StatusPill key={`${row.id}-st`} value={row.state} />,
              row.customer_name,
              row.retailer_name ?? "—",
              row.distributor_name ?? "—",
              row.hub_name ?? "—",
              <Link key={`${row.id}-v`} href={`/admin/sales/${row.id}`} className="text-sm font-semibold text-brand-700">
                View
              </Link>,
            ])}
          />
        )
      )}

      {result && result.reportType !== "SALES" && (
        <EmptyState title="Report not available" body="This report type does not have a viewer yet." />
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
