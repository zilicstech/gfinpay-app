"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { when } from "@/lib/format";
import { partnerStatusLabel } from "@/lib/partner-status";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import { EntityHero, type ManageAction } from "@/features/console/EntityChrome";

type Mismatch = {
  id: number;
  mismatch_type: string;
  partner_ref?: string;
  resolution?: string;
  details?: Record<string, unknown>;
};

type ReconRow = {
  id: string;
  customer_mobile?: string;
  customer_name?: string;
  retailer_label?: string;
  distributor_label?: string;
  hub_label?: string;
  identified?: boolean;
  current_status?: string;
  lead_id?: string;
};

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
  status_counts?: Record<string, number>;
  started_at?: string;
  mismatches?: Mismatch[];
  rows?: ReconRow[];
};

export default function ReconDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [mismatchId, setMismatchId] = useState("");
  const [resolution, setResolution] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function load() {
    const row = await api<Batch>(`/api/v1/admin/recon/${id}`, { token });
    setBatch(row);
    if (row.mismatches?.[0]) setMismatchId(String(row.mismatches[0].id));
  }

  useEffect(() => {
    if (token && id) load().catch((e) => flash.fail(e, "Failed to load batch"));
  }, [token, id]);

  async function resolve(e: FormEvent) {
    e.preventDefault();
    try {
      setBatch(await api<Batch>(`/api/v1/admin/recon/mismatches/${mismatchId}/resolve`, {
        token, method: "POST", body: JSON.stringify({ resolution }),
      }));
      setResolution("");
      setOpen(false);
      flash.ok("Mismatch marked resolved.");
    } catch (err) { flash.fail(err, "Could not resolve"); }
  }

  async function remove(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/recon/${id}`, { token, method: "DELETE" });
      router.push("/admin/recon");
    } catch (err) {
      flash.fail(err, "Could not delete recon");
    }
  }

  if (!batch) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const statusCounts = Object.entries(batch.status_counts ?? {});
  const manageActions: ManageAction[] = [
    ...(batch.mismatches?.length ? [{ label: "Resolve mismatch", onClick: () => setOpen(true) }] : []),
    { label: "Delete recon", onClick: () => setDeleteOpen(true), tone: "danger" },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/recon" className="text-sm font-semibold text-navy-700 underline">
        All recon
      </Link>
      <Flash message={flash.message} error={flash.error} />
      <EntityHero
        title={batch.provider}
        status={batch.status}
        lines={[
          <p key="date" className="text-sm text-white/70">{String(batch.business_date).slice(0, 10)}</p>,
          <p key="meta" className="text-xs text-white/50">Started {when(batch.started_at)}</p>,
        ]}
        manageActions={manageActions}
        stats={[
          { label: "Rows", value: batch.total_rows ?? batch.eligible_count ?? 0 },
          { label: "Matched", value: batch.matched_rows ?? batch.matched_count ?? 0 },
          { label: "Unidentified", value: batch.unidentified_rows ?? 0 },
          { label: "Mismatches", value: batch.mismatches?.length ?? 0 },
        ]}
      />
      {statusCounts.length > 0 ? (
        <DataTable
          columns={["Partner status", "Rows"]}
          rows={statusCounts.map(([status, count]) => [
            partnerStatusLabel(status),
            String(count),
          ])}
        />
      ) : null}
      {!batch.rows?.length ? (
        <EmptyState title="No uploaded rows" body="This batch has no stored MIS rows." />
      ) : (
        <DataTable
          columns={["Phone", "Customer", "Retailer", "Distributor", "Hub", "Status", "Match"]}
          rows={batch.rows.map((r) => [
            r.customer_mobile ?? "—",
            r.customer_name ?? "—",
            r.retailer_label ?? "UNIDENTIFIED",
            r.distributor_label ?? "UNIDENTIFIED",
            r.hub_label ?? "—",
            partnerStatusLabel(r.current_status),
            r.identified ? "Matched" : "Unidentified",
          ])}
        />
      )}
      {!batch.mismatches?.length ? (
        <EmptyState title="No mismatches" body="Every MIS row matched an internal sale, or there were no rows requiring ops follow-up." />
      ) : (
        <DataTable
          columns={["Type", "Phone", "Partner step", "Partner ref", "Resolution"]}
          rows={batch.mismatches.map((m) => [
            m.mismatch_type,
            String(m.details?.phone ?? "—"),
            partnerStatusLabel(typeof m.details?.partner_status === "string" ? m.details.partner_status : undefined),
            m.partner_ref ?? "—",
            m.resolution ?? "Open",
          ])}
        />
      )}
      <FormModal open={open} title="Resolve a mismatch" onClose={() => setOpen(false)} onSubmit={resolve} submitLabel="Save resolution">
        <TextField label="Mismatch id" required value={mismatchId} onChange={setMismatchId} />
        <TextField label="Resolution note" required value={resolution} onChange={setResolution} />
      </FormModal>
      <FormModal
        open={deleteOpen}
        title="Delete this recon?"
        description="Removes the batch, every uploaded row, and mismatches. Sales and commissions already applied are not reversed."
        onClose={() => setDeleteOpen(false)}
        onSubmit={remove}
        submitLabel="Delete recon"
      >
        <p className="text-sm text-navy-600">This cannot be undone. You can upload the Excel again afterwards.</p>
      </FormModal>
    </div>
  );
}
