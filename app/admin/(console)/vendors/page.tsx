"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, openDetails } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Field, PageHeader, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";

type Vendor = {
  id: string;
  code: string;
  full_name: string;
  mobile: string;
  email?: string;
  hub_name?: string;
  status: string;
  created_at?: string;
};

type Hub = { id: string; name: string; code: string };

export default function VendorsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();
  const [rows, setRows] = useState<Vendor[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [hubId, setHubId] = useState("");

  async function load() {
    const [v, h] = await Promise.all([
      api<Vendor[]>("/api/v1/admin/vendors", { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setRows(v);
    setHubs(h);
    if (!hubId && h[0]) setHubId(h[0].id);
  }

  useEffect(() => {
    if (token) load().catch((e) => flash.fail(e, "Failed to load vendors"));
  }, [token]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<Vendor>("/api/v1/admin/vendors", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({ fullName: fullName.trim(), mobile, email: email.trim() || undefined, hubId }),
      });
      openDetails(`/admin/vendors/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create vendor");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Vendors"
        description="Marketing partners under a hub. They use a public link to mint employee affiliate URLs — no login."
        actions={<button className="btn-primary" onClick={() => setOpen(true)} disabled={hubs.length === 0}>Add vendor</button>}
      />
      {rows.length === 0 ? (
        <EmptyState title="No vendors yet" body="Onboard a vendor and share their public console URL." />
      ) : (
        <DataTable
          columns={["Code", "Name", "Hub", "Mobile", "Email", "Status", "Created", ""]}
          rows={rows.map((v) => [
            <span key={`${v.id}-c`} className="font-mono text-sm">{v.code}</span>,
            v.full_name,
            v.hub_name ?? "—",
            maskMobile(v.mobile),
            v.email ?? "—",
            <StatusPill key={v.id} value={v.status} />,
            v.created_at ? when(v.created_at) : "—",
            <ViewLink key={`${v.id}-v`} href={`/admin/vendors/${v.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal open={open} title="Add vendor" onClose={() => setOpen(false)} onSubmit={create} submitLabel="Create">
        <Field label="Full name">
          <input className="field" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Mobile">
          <input className="field" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <SelectField label="Hub" required value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: `${h.name} (${h.code})` }))} placeholder="Select hub" />
      </FormModal>
    </div>
  );
}
