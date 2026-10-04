"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Layers, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  UploadCloud 
} from "lucide-react";
import { api, apiForm, openDetails } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Field, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";

const REPORT_TYPES = [
  { value: "ZET", label: "ZET MIS Report (Cards & Loans)" },
  { value: "PAYSPRINT", label: "PaySprint Switch Reconciliation" },
  { value: "GROWMORE", label: "GrowMore Merchant Statements" },
];

type Batch = {
  id: string;
  provider: string;
  business_date: string;
  status: string;
  total_rows?: number;
  matched_rows?: number;
  matched_count?: number;
  unidentified_rows?: number;
  activated_count?: number;
  eligible_count?: number;
};

export default function ReconPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [rows, setRows] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState("ALL");

  // Upload modal
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Batch[]>("/api/v1/admin/recon", { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      flash.fail(e, "Failed to load reconciliation batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  function closeModal() {
    setOpen(false);
    setReportType("");
    setFile(null);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!reportType || !file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("reportType", reportType);
      form.append("file", file);
      const created = await apiForm<Batch>("/api/v1/admin/recon/reports", form, { token, holdLoader: true });
      openDetails(`/admin/recon/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not process reconciliation file");
    } finally {
      setUploading(false);
    }
  }

  const metrics = useMemo(() => {
    const totalBatches = rows.length;
    let totalRows = 0;
    let totalMatched = 0;
    let totalExceptions = 0;

    for (const r of rows) {
      totalRows += Number(r.total_rows ?? r.eligible_count ?? 0);
      totalMatched += Number(r.matched_rows ?? r.matched_count ?? 0);
      totalExceptions += Number(r.unidentified_rows ?? 0);
    }

    return { totalBatches, totalRows, totalMatched, totalExceptions };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (providerFilter === "ALL") return rows;
    return rows.filter((r) => r.provider.toUpperCase().includes(providerFilter));
  }, [rows, providerFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Clearing & Settlements
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Provider Reconciliation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload banking switch MIS spreadsheets to auto-reconcile customer funnel steps and activate payouts.
          </p>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <UploadCloud className="h-4 w-4" />
          Upload MIS Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Batches Ingested"
          value={String(metrics.totalBatches)}
          hint="Reconciliation runs"
          icon={<FileSpreadsheet className="h-5 w-5" />}
        />
        <StatCard
          label="Reconciled Rows"
          value={String(metrics.totalMatched)}
          hint="Matched to internal sales"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Total Records"
          value={String(metrics.totalRows)}
          hint="Processed from provider MIS"
          icon={<Layers className="h-5 w-5" />}
        />
        <StatCard
          label="Unidentified Rows"
          value={String(metrics.totalExceptions)}
          hint="Require manual inspection"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Control Bar & Table */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Providers"],
              ["ZET", "ZET Reports"],
              ["PAYSPRINT", "PaySprint"],
              ["GROWMORE", "GrowMore"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setProviderFilter(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  providerFilter === key
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No reconciliation batches found"
            body="Upload weekly provider MIS files to trigger automated parsing and sales activation."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Provider / Rail</th>
                  <th className="px-6 py-4">Settlement Date</th>
                  <th className="px-6 py-4">Total Rows</th>
                  <th className="px-6 py-4">Matched & Verified</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{r.provider}</p>
                          <span className="font-mono text-[11px] text-slate-400">Batch {r.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {String(r.business_date).slice(0, 10)}
                    </td>
                    <td className="px-6 py-4 font-medium text-navy-950 text-sm">
                      {String(r.total_rows ?? r.eligible_count ?? 0)} rows
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-emerald-700 text-sm">
                          {String(r.matched_rows ?? r.matched_count ?? 0)} matched
                        </span>
                        {Number(r.unidentified_rows || 0) > 0 && (
                          <span className="block text-[11px] text-amber-600 font-medium mt-0.5">
                            {r.unidentified_rows} exceptions
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/recon/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Inspect
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

      {/* Upload Modal */}
      <FormModal
        open={open}
        title="Upload Provider MIS File"
        description="Select the banking provider and attach their weekly settlement Excel file. ZET files auto-match cards by mobile."
        onClose={closeModal}
        onSubmit={create}
        submitLabel={uploading ? "Parsing File..." : "Start Reconciliation"}
        submitDisabled={!reportType || !file || uploading}
      >
        <SelectField
          label="Partner Provider"
          required
          value={reportType}
          onChange={setReportType}
          options={REPORT_TYPES}
          placeholder="Select Provider Rail"
        />
        <Field label="Upload Excel Document (.xlsx, .xls)">
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50">
            <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <input
              type="file"
              required
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-950 file:text-white hover:file:bg-slate-800"
            />
            {file && (
              <p className="mt-2 text-xs font-bold text-emerald-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
        </Field>
      </FormModal>
    </div>
  );
}
