"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import { retailerLocationLine } from "@/features/admin/retailer-location";
import type { OutletRow } from "@/features/desk/types";

export default function NetworkPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();
  const [rows, setRows] = useState<OutletRow[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RetailerDraft>(emptyRetailerDraft);

  async function load() {
    setRows(await api<OutletRow[]>("/api/v1/desk/outlets", { token }));
  }

  useEffect(() => {
    if (token) load().catch((e) => flash.fail(e, "Failed to load outlets"));
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboard") === "1") {
      setOpen(true);
    }
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<OutletRow>("/api/v1/desk/outlets", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          password: draft.password,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`/distributor/agents/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create retailer");
    }
  }

  const active = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Retailers"
        description="Each outlet sits under your network. Open a row to manage eKYC, float and status."
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            Add retailer
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Retailers" value={String(rows.length)} hint="BC outlets" icon={<Store className="h-5 w-5" />} />
        <StatCard label="Active" value={String(active)} hint="Can sign in and operate the outlet desk" />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No outlets yet" body="Add a retailer under you. Share the password with the owner separately." />
      ) : (
        <DataTable
          columns={["Code", "Name", "Location", "Mobile", "eKYC", "Status", "Created by", "Created", ""]}
          rows={rows.map((u) => [
            <span key={`${u.id}-code`} className="font-mono text-sm tracking-wide">
              {u.code ?? "—"}
            </span>,
            u.full_name,
            retailerLocationLine({
              city: u.retailer_city,
              state: u.retailer_state,
              pincode: u.retailer_pincode,
            }),
            maskMobile(u.mobile),
            <EkycBadge key={`${u.id}-kyc`} status={u.kyc_status} />,
            <StatusPill key={u.id} value={u.status} />,
            createdByLabel(u.created_by_name, u.created_by_code),
            u.created_at ? when(u.created_at) : "—",
            <ViewLink key={`${u.id}-v`} href={`/distributor/agents/${u.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal
        open={open}
        title="Place a retailer"
        description="Place the retailer under your network. Catalog sales go live from their outlet."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create retailer"
        submitDisabled={!retailerDraftReady(draft)}
      >
        <RetailerOnboardFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
