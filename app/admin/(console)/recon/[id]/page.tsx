"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import { EntityHero, type ManageAction } from "@/features/console/EntityChrome";

type Mismatch = { id: number; mismatch_type: string; partner_ref?: string; resolution?: string };
type Batch = {
  id: string;
  provider: string;
  business_date: string;
  status: string;
  total_rows?: number;
  matched_rows?: number;
  activated_count?: number;
  eligible_count?: number;
  started_at?: string;
  mismatches?: Mismatch[];
};

export default function ReconDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [mismatchId, setMismatchId] = useState("");
  const [resolution, setResolution] = useState("");
  const [open, setOpen] = useState(false);

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

  if (!batch) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const manageActions: ManageAction[] = batch.mismatches?.length
    ? [{ label: "Resolve mismatch", onClick: () => setOpen(true) }]
    : [];

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
          { label: "Activated", value: `${batch.matched_rows ?? batch.activated_count ?? 0} / ${batch.total_rows ?? batch.eligible_count ?? 0}` },
          { label: "Mismatches", value: batch.mismatches?.length ?? 0 },
        ]}
      />
      {!batch.mismatches?.length ? (
        <EmptyState title="Recon complete" body="Excel row matching is not wired yet. Open generated-link cards for this provider were marked activated and commission was posted. Mismatches will appear here when partner files are parsed." />
      ) : (
        <DataTable
          columns={["Type", "Partner ref", "Resolution"]}
          rows={batch.mismatches.map((m) => [m.mismatch_type, m.partner_ref ?? "—", m.resolution ?? "Open"])}
        />
      )}
      <FormModal open={open} title="Resolve a mismatch" onClose={() => setOpen(false)} onSubmit={resolve} submitLabel="Save resolution">
        <TextField label="Mismatch id" required value={mismatchId} onChange={setMismatchId} />
        <TextField label="Resolution note" required value={resolution} onChange={setResolution} />
      </FormModal>
    </div>
  );
}
