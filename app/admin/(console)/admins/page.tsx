"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { maskMobile } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import type { Hub, UserRow } from "@/features/admin/types";

export default function AdminsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();
  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [hubId, setHubId] = useState("");

  async function refresh() {
    const [all, hubRows] = await Promise.all([
      api<UserRow[]>("/api/v1/admin/users?type=ADMIN", { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setAdmins(all);
    setHubs(hubRows);
    if (!hubId && hubRows[0]) setHubId(hubRows[0].id);
  }

  useEffect(() => {
    if (token) refresh().catch((e) => flash.fail(e, "Failed to load admins"));
  }, [token]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<UserRow>("/api/v1/admin/users/admins", {
        token, method: "POST", holdLoader: true,
        body: JSON.stringify({ fullName: name, mobile, password, email: `${mobile}@gfinpay.com`, hubId }),
      });
      openDetails(`/admin/admins/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create admin");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Hub admins"
        description="Only a super admin can create hub admins. They see distributors and retailers in their assigned hubs."
        actions={<button className="btn-primary" onClick={() => setOpen(true)} disabled={hubs.length === 0}>Add admin</button>}
      />
      <StatCard label="Hub admins" value={String(admins.length)} hint="Created by super admin" icon={<Shield className="h-5 w-5" />} />
      {admins.length === 0 ? (
        <EmptyState title="No hub admins yet" body="Create an admin for a hub so operations are not concentrated on one login." />
      ) : (
        <DataTable
          columns={["Name", "Hub", "Mobile", "Status", ""]}
          rows={admins.map((u) => [
            u.full_name,
            u.hub_name ?? "—",
            maskMobile(u.mobile),
            <StatusPill key={u.id} value={u.status} />,
            <ViewLink key={`${u.id}-v`} href={`/admin/admins/${u.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal open={open} title="Add a hub admin" description="They sign in with their mobile or GFIN code." onClose={() => setOpen(false)} onSubmit={create} submitLabel="Create admin">
        <TextField label="Full name" required value={name} onChange={setName} />
        <TextField label="Mobile" required inputMode="numeric" value={mobile} onChange={setMobile} />
        <SelectField label="Hub" required value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))} />
        <TextField label="Temporary password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
    </div>
  );
}
