"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiForm, openDetails } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Field, PageHeader, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";

const REPORT_TYPES = [
  { value: "ZET", label: "ZET" },
  { value: "PAYSPRINT", label: "PAYSPRINT" },
  { value: "GROWMORE", label: "GROWMORE" },
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
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setRows(await api<Batch[]>("/api/v1/admin/recon", { token }));
  }

  useEffect(() => {
    if (token) load().catch((e) => flash.fail(e, "Failed to load recon"));
  }, [token]);

  function closeModal() {
    setOpen(false);
    setReportType("");
    setFile(null);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!reportType || !file) return;
    try {
      const form = new FormData();
      form.append("reportType", reportType);
      form.append("file", file);
      const created = await apiForm<Batch>("/api/v1/admin/recon/reports", form, { token, holdLoader: true });
      openDetails(`/admin/recon/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not reconcile report");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ops"
        title="Reconciliation"
        description="Upload the provider weekly Excel. ZET files are matched to sales by mobile and card (SBM/IOB); partner funnel steps update on each row. PaySprint and GrowMore parsers are not live yet."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>Add report</button>}
      />
      {rows.length === 0 ? (
        <EmptyState title="No reports yet" body="Add a weekly Excel when the provider sends sales." />
      ) : (
        <DataTable
          columns={["Report type", "Date", "Rows", "Matched", "Status", ""]}
          rows={rows.map((r) => [
            r.provider,
            String(r.business_date).slice(0, 10),
            String(r.total_rows ?? r.eligible_count ?? 0),
            `${r.matched_rows ?? r.matched_count ?? 0}${r.unidentified_rows ? ` · ${r.unidentified_rows} unidentified` : ""}`,
            <StatusPill key={r.id} value={r.status} />,
            <ViewLink key={`${r.id}-v`} href={`/admin/recon/${r.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal
        open={open}
        title="Add report"
        description="Select the provider and upload their weekly Excel. ZET reconciles funnel steps and activates only when the MIS shows card activation."
        onClose={closeModal}
        onSubmit={create}
        submitLabel="Reconcile"
        submitDisabled={!reportType || !file}
      >
        <SelectField
          label="Report type"
          required
          value={reportType}
          onChange={setReportType}
          options={REPORT_TYPES}
          placeholder="Select report type"
        />
        <Field label="Excel file">
          <input
            className="field"
            type="file"
            required
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
      </FormModal>
    </div>
  );
}
