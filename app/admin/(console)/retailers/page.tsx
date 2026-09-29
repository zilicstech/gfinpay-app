"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import type { UserRow } from "@/features/admin/types";

export default function RetailersPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();
  const [retailers, setRetailers] = useState<UserRow[]>([]);
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RetailerDraft>(emptyRetailerDraft);
  const [distributorId, setDistributorId] = useState("");

  async function refresh() {
    const [r, d] = await Promise.all([
      api<UserRow[]>("/api/v1/admin/users?type=RETAILER", { token }),
      api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
    ]);
    setRetailers(r);
    setDistributors(d);
    if (!distributorId && d[0]) setDistributorId(d[0].id);
  }

  useEffect(() => {
    if (token) refresh().catch((e) => flash.fail(e, "Failed to load retailers"));
  }, [token]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<UserRow>("/api/v1/admin/users/retailers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          password: draft.password,
          email: `${draft.mobile}@gfinpay.com`,
          distributorId,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`/admin/retailers/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create retailer");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Retailers"
        description="Each outlet sits under a distributor and inherits that hub. Open a row to manage eKYC, float and status."
        actions={<button className="btn-primary" onClick={() => setOpen(true)} disabled={distributors.length === 0}>Add retailer</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Retailers" value={String(retailers.length)} hint="BC outlets" icon={<Store className="h-5 w-5" />} />
        <StatCard label="Distributors available" value={String(distributors.length)} hint="Required before an outlet can be placed" />
      </div>
      {retailers.length === 0 ? (
        <EmptyState title="No outlets yet" body="Appoint a distributor first, then place a retailer under them." />
      ) : (
        <DataTable
          columns={["Code", "Name", "Distributor", "Hub", "Mobile", "eKYC", "Status", "Created by", "Created", ""]}
          rows={retailers.map((u) => [
            <span key={`${u.id}-code`} className="font-mono text-sm tracking-wide">
              {u.code ?? "—"}
            </span>,
            u.full_name,
            u.parent_name ?? "—",
            u.hub_name ?? "—",
            maskMobile(u.mobile),
            <EkycBadge key={`${u.id}-kyc`} status={u.kyc_status} />,
            <StatusPill key={u.id} value={u.status} />,
            createdByLabel(u.created_by_name, u.created_by_code),
            u.created_at ? when(u.created_at) : "—",
            <ViewLink key={`${u.id}-v`} href={`/admin/retailers/${u.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal
        open={open}
        title="Place a retailer"
        description="Place the retailer under a distributor. Catalog sales go live from their outlet."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create retailer"
        submitDisabled={!retailerDraftReady(draft) || !distributorId}
      >
        <RetailerOnboardFields value={draft} onChange={setDraft} />
        <SelectField label="Distributor" required value={distributorId} onChange={setDistributorId} options={distributors.map((d) => ({ value: d.id, label: `${d.full_name}${d.hub_name ? ` · ${d.hub_name}` : ""}` }))} />
      </FormModal>
    </div>
  );
}
