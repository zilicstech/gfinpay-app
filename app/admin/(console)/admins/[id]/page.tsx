"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, Copy } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EntityHero, type ManageAction } from "@/features/console/EntityChrome";
import type { Hub, UserDetail, UserRow } from "@/features/admin/types";

type Modal = "hub" | "password" | "inactivate" | "activate" | null;

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubId, setHubId] = useState("");
  const [password, setPassword] = useState("");
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const [u, h, d] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
      api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
    ]);
    setUser(u);
    setHubs(h);
    setHubId(u.hub_id ?? "");
    setDistributors(d.filter((row) => row.hub_id === u.hub_id));
  }

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load admin")));
    }
  }, [token, id]);

  async function patchStatus(status: string) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Admin is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function saveHub(e: FormEvent) {
    e.preventDefault();
    try {
      const next = await api<UserDetail>(`/api/v1/admin/users/${id}/hub`, { token, method: "PATCH", body: JSON.stringify({ hubId }) });
      setUser(next);
      const d = await api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token });
      setDistributors(d.filter((row) => row.hub_id === next.hub_id));
      setModal(null);
      flash.ok("Admin moved to the new hub.");
    } catch (e) {
      flash.fail(e, "Could not move hub");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, { token, method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setModal(null);
      flash.ok("Password reset. Share it out of band.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const hubLine = [user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ");
  const manageActions: ManageAction[] = [
    { label: "Change hub", onClick: () => setModal("hub") },
    { label: "Reset password", onClick: () => setModal("password") },
    user.status === "ACTIVE"
      ? { label: "Inactivate", onClick: () => setModal("inactivate"), tone: "danger" }
      : { label: "Restore access", onClick: () => setModal("activate") },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/admins" className="text-sm font-semibold text-navy-700 underline">
        All admins
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <EntityHero
        title={user.full_name}
        status={user.status}
        code={user.code}
        lines={[
          <p key="mobile" className="flex items-center gap-2 font-mono text-sm tracking-widest text-white/80">
            <span>{maskMobile(user.mobile)}</span>
            <button
              type="button"
              className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={copied ? "Mobile copied" : "Copy mobile"}
              onClick={copyMobile}
            >
              <Copy className={`h-3.5 w-3.5 ${copied ? "text-emerald-300" : ""}`} />
            </button>
          </p>,
          <p key="hub" className="flex items-center gap-1.5 text-sm text-white/70">
            <Building2 className="h-3.5 w-3.5" />
            {hubLine || "No hub assigned"}
          </p>,
          <p key="meta" className="text-xs text-white/50">
            Appointed {when(user.created_at)} · by {user.created_by_name ?? "platform"}
          </p>,
        ]}
        manageActions={manageActions}
        stats={[
          { label: "GFIN code", value: user.code ?? "—" },
          { label: "Hub", value: user.hub_name ?? "—" },
          { label: "Distributors", value: distributors.length },
        ]}
      />

      <section className="space-y-3">
        <h3 className="font-display text-xl text-navy-950">Distributors on this hub</h3>
        {distributors.length === 0 ? (
          <EmptyState title="No distributors on this hub" body="Appoint one from the Distributors page." />
        ) : (
          <DataTable
            columns={["Name", "Code", "Mobile", "Status", ""]}
            rows={distributors.map((d) => [
              d.full_name,
              d.code ?? "—",
              maskMobile(d.mobile),
              <StatusPill key={d.id} value={d.status} />,
              <ViewLink key={`${d.id}-v`} href={`/admin/distributors/${d.id}`} />,
            ])}
          />
        )}
      </section>

      <FormModal open={modal === "hub"} title="Change hub" description="Moves this operator onto a different geography." onClose={() => setModal(null)} onSubmit={saveHub} submitLabel="Save hub">
        <SelectField label="Hub" required value={hubId} onChange={setHubId} options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))} />
      </FormModal>
      <FormModal open={modal === "password"} title="Reset password" onClose={() => setModal(null)} onSubmit={resetPassword} submitLabel="Reset password">
        <TextField label="New password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Inactivate admin" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("SUSPENDED"); }} submitLabel="Inactivate">
        <p className="text-sm text-navy-600">They will not be able to sign in at the admin desk until you restore access.</p>
      </FormModal>
      <FormModal open={modal === "activate"} title="Restore access" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("ACTIVE"); }} submitLabel="Restore">
        <p className="text-sm text-navy-600">Return this operator to the hub desk.</p>
      </FormModal>
    </div>
  );
}
