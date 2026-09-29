"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";
import type { Hub, UserRow } from "@/features/admin/types";

export default function DistributorsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [hubId, setHubId] = useState("");

  async function refresh() {
    const [all, hubRows] = await Promise.all([
      api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setUsers(all);
    setHubs(hubRows);
    if (!hubId && hubRows[0]) setHubId(hubRows[0].id);
  }

  useEffect(() => {
    if (token) refresh().catch((e) => flash.fail(e, "Failed to load distributors"));
  }, [token]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<UserRow>("/api/v1/admin/users/distributors", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({ fullName: name, mobile, password, email: `${mobile}@gfinpay.com`, hubId }),
      });
      openDetails(`/admin/distributors/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create distributor");
    }
  }

  const live = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Distributors"
        description="Each distributor owns a hub geography. Appoint them here, then manage status, float and outlets on their page."
        actions={<button className="btn-primary" onClick={() => setOpen(true)} disabled={hubs.length === 0}>Add distributor</button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Distributors" value={String(users.length)} hint="Appointed by admin" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active" value={String(live)} hint="Can onboard outlets" />
        <StatCard label="Hubs" value={String(hubs.length)} hint="Configure in Settings" />
      </div>
      {users.length === 0 ? (
        <EmptyState title="No distributors yet" body={hubs.length === 0 ? "Create a hub in Settings first." : "Add the first distributor for a hub."} />
      ) : (
        <DataTable
          columns={["Code", "Name", "Hub", "Mobile", "eKYC", "Status", "Created by", "Created", ""]}
          rows={users.map((u) => [
            <span key={`${u.id}-code`} className="font-mono text-sm tracking-wide">
              {u.code ?? "—"}
            </span>,
            u.full_name,
            u.hub_name ?? "Unassigned",
            maskMobile(u.mobile),
            <EkycBadge key={`${u.id}-kyc`} status={u.kyc_status} />,
            <StatusPill key={u.id} value={u.status} />,
            createdByLabel(u.created_by_name, u.created_by_code),
            u.created_at ? when(u.created_at) : "—",
            <ViewLink key={`${u.id}-v`} href={`/admin/distributors/${u.id}`} />,
          ])}
        />
      )}
      <Flash message={flash.message} error={flash.error} />
      <FormModal open={open} title="Appoint a distributor" description="They sit on one hub and can later receive retailers." onClose={() => setOpen(false)} onSubmit={create} submitLabel="Create distributor">
        <TextField label="Full name" required value={name} onChange={setName} />
        <TextField label="Mobile" required inputMode="numeric" value={mobile} onChange={setMobile} />
        <SelectField label="Hub" required value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))} />
        <TextField label="Temporary password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
    </div>
  );
}
