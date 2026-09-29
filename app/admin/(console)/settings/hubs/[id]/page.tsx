"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import {
  DirectoryAssignModal,
  Flash,
  FormModal,
  TextField,
  ViewLink,
  useFlash,
} from "@/features/admin/AdminChrome";
import { EntityHero, EntityTabs, entityPrimaryActionClass, type ManageAction } from "@/features/console/EntityChrome";
import type { AdminDirectoryRow, DistributorDirectoryRow, Hub } from "@/features/admin/types";

type Modal = "edit" | "suspend" | "activate" | "add-distributor" | "add-admin" | null;
type Tab = "distributors" | "admins";

export default function HubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [hub, setHub] = useState<Hub | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<Tab>("distributors");
  const [distributorDir, setDistributorDir] = useState<DistributorDirectoryRow[]>([]);
  const [adminDir, setAdminDir] = useState<AdminDirectoryRow[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<Set<string>>(new Set());
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [dirLoading, setDirLoading] = useState(false);

  async function load() {
    const row = await api<Hub>(`/api/v1/admin/hubs/${id}`, { token });
    setHub(row);
    setName(row.name);
    setCity(row.city);
    setState(row.state);
    setNotes(row.notes ?? "");
  }

  useEffect(() => {
    if (token && id) load().catch((e) => flash.fail(e, "Failed to load hub"));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || modal !== "add-distributor") return;
    setDirLoading(true);
    setSelectedDistributors(new Set());
    api<DistributorDirectoryRow[]>(`/api/v1/admin/hubs/${id}/distributors/directory`, { token })
      .then(setDistributorDir)
      .catch((e) => flash.fail(e, "Could not load distributors"))
      .finally(() => setDirLoading(false));
  }, [token, id, modal]);

  useEffect(() => {
    if (!token || !id || modal !== "add-admin") return;
    setDirLoading(true);
    setSelectedAdmins(new Set());
    api<AdminDirectoryRow[]>(`/api/v1/admin/hubs/${id}/admins/directory`, { token })
      .then(setAdminDir)
      .catch((e) => flash.fail(e, "Could not load admins"))
      .finally(() => setDirLoading(false));
  }, [token, id, modal]);

  function toggleSelected(setter: (fn: (prev: Set<string>) => Set<string>) => void, userId: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      setHub(await api<Hub>(`/api/v1/admin/hubs/${id}`, { token, method: "PATCH", body: JSON.stringify({ name, city, state, notes }) }));
      setModal(null);
      flash.ok("Hub updated.");
    } catch (e) { flash.fail(e, "Could not update hub"); }
  }

  async function setStatus(status: string) {
    try {
      setHub(await api<Hub>(`/api/v1/admin/hubs/${id}`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Hub is ${status.toLowerCase()}.`);
    } catch (e) { flash.fail(e, "Could not change hub status"); }
  }

  async function assignDistributors(e: FormEvent) {
    e.preventDefault();
    const userIds = [...selectedDistributors];
    if (!userIds.length) return;
    try {
      setHub(await api<Hub>(`/api/v1/admin/hubs/${id}/distributors/assign`, {
        token,
        method: "POST",
        body: JSON.stringify({ userIds }),
      }));
      setModal(null);
      flash.ok(userIds.length === 1 ? "Distributor added to hub." : `${userIds.length} distributors added to hub.`);
    } catch (e) { flash.fail(e, "Could not assign distributors"); }
  }

  async function assignAdmins(e: FormEvent) {
    e.preventDefault();
    const userIds = [...selectedAdmins];
    if (!userIds.length) return;
    try {
      setHub(await api<Hub>(`/api/v1/admin/hubs/${id}/admins/assign`, {
        token,
        method: "POST",
        body: JSON.stringify({ userIds }),
      }));
      setModal(null);
      flash.ok(userIds.length === 1 ? "Admin assigned to hub." : `${userIds.length} admins assigned to hub.`);
    } catch (e) { flash.fail(e, "Could not assign admins"); }
  }

  if (!hub) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const manageActions: ManageAction[] = [
    { label: "Edit hub", onClick: () => setModal("edit") },
    hub.status === "ACTIVE"
      ? { label: "Suspend hub", onClick: () => setModal("suspend"), tone: "danger" }
      : { label: "Activate hub", onClick: () => setModal("activate") },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/settings" className="text-sm font-semibold text-navy-700 underline">
        Settings
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <EntityHero
        title={hub.name}
        status={hub.status}
        code={hub.code}
        lines={[
          <p key="place" className="flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="h-3.5 w-3.5" />
            {hub.city}, {hub.state}
          </p>,
          <p key="meta" className="text-xs text-white/50">
            Created {when(hub.created_at)} · by {createdByLabel(hub.created_by_name, hub.created_by_code)}
          </p>,
        ]}
        manageActions={manageActions}
        primaryActions={
          <>
            <button type="button" className={entityPrimaryActionClass} onClick={() => setModal("add-distributor")}>
              <Plus className="h-4 w-4" /> Add distributor
            </button>
            <button type="button" className={entityPrimaryActionClass} onClick={() => setModal("add-admin")}>
              <Plus className="h-4 w-4" /> Add admin
            </button>
          </>
        }
        stats={[
          { label: "Distributors", value: hub.distributors?.length ?? 0 },
          { label: "Hub admins", value: hub.admins?.length ?? 0 },
          { label: "Notes", value: hub.notes?.trim() ? "Yes" : "—" },
        ]}
      />

      <section className="space-y-3">
        <EntityTabs
          value={tab}
          onChange={setTab}
          items={[
            { key: "distributors", label: "Distributors" },
            { key: "admins", label: "Hub admins" },
          ]}
        />
        {tab === "distributors" ? (
          !hub.distributors?.length ? (
            <EmptyState title="No distributors on this hub" body="Add distributors from the platform directory." />
          ) : (
            <DataTable
              columns={["Name", "Code", "Mobile", "Status", ""]}
              rows={hub.distributors.map((d) => [
                d.full_name,
                d.code ?? "—",
                maskMobile(d.mobile),
                <StatusPill key={d.id} value={d.status} />,
                <ViewLink key={`${d.id}-v`} href={`/admin/distributors/${d.id}`} />,
              ])}
            />
          )
        ) : !hub.admins?.length ? (
          <EmptyState title="No hub admin yet" body="Assign operators from the admin directory." />
        ) : (
          <DataTable
            columns={["Name", "Code", "Mobile", "Status", ""]}
            rows={hub.admins.map((a) => [
              a.full_name,
              a.code ?? "—",
              maskMobile(a.mobile),
              <StatusPill key={a.id} value={a.status} />,
              <ViewLink key={`${a.id}-v`} href={`/admin/admins/${a.id}`} />,
            ])}
          />
        )}
      </section>

      <FormModal open={modal === "edit"} title="Edit hub" onClose={() => setModal(null)} onSubmit={save} submitLabel="Save hub">
        <TextField label="Name" required value={name} onChange={setName} />
        <TextField label="City" required value={city} onChange={setCity} />
        <TextField label="State" required value={state} onChange={setState} />
        <TextField label="Notes" value={notes} onChange={setNotes} />
      </FormModal>
      <FormModal open={modal === "suspend"} title="Suspend hub" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); setStatus("SUSPENDED"); }} submitLabel="Suspend">
        <p className="text-sm text-navy-600">New distributors cannot be appointed here until the hub is active again.</p>
      </FormModal>
      <FormModal open={modal === "activate"} title="Activate hub" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); setStatus("ACTIVE"); }} submitLabel="Activate">
        <p className="text-sm text-navy-600">Re-open this geography for appointments.</p>
      </FormModal>
      <DirectoryAssignModal
        open={modal === "add-distributor"}
        title="Add distributors"
        description="Select distributors to assign to this hub. Moving a distributor from another hub also moves their retailers."
        items={distributorDir.map((d) => ({
          id: d.id,
          title: d.full_name,
          subtitle: [
            maskMobile(d.mobile),
            d.hub_name ? `Current hub: ${d.hub_name}` : "No hub yet",
          ].join(" · "),
          assignedHere: d.assigned_here,
        }))}
        selected={selectedDistributors}
        loading={dirLoading}
        emptyTitle="No distributors in the directory. Create one from Distributors first."
        onToggle={(userId) => toggleSelected(setSelectedDistributors, userId)}
        onClose={() => setModal(null)}
        onSubmit={assignDistributors}
        submitLabel="Add to hub"
      />
      <DirectoryAssignModal
        open={modal === "add-admin"}
        title="Add admins"
        description="Select hub admins to assign. An admin can operate multiple hubs."
        items={adminDir.map((a) => ({
          id: a.id,
          title: a.full_name,
          subtitle: [
            a.email ?? maskMobile(a.mobile),
            a.hub_names ? `Hubs: ${a.hub_names}` : "Not assigned to any hub yet",
          ].join(" · "),
          assignedHere: a.assigned_here,
        }))}
        selected={selectedAdmins}
        loading={dirLoading}
        emptyTitle="No hub admins in the directory. Create one from Admins first."
        onToggle={(userId) => toggleSelected(setSelectedAdmins, userId)}
        onClose={() => setModal(null)}
        onSubmit={assignAdmins}
        submitLabel="Assign to hub"
      />
    </div>
  );
}
