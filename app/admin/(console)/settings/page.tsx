"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, ToggleLeft } from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, Modal, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { FdCardsConsole } from "@/features/admin/FdCardsConsole";
import type { Hub, PlatformService } from "@/features/admin/types";

type Tab = "hubs" | "services" | "fd-cards";

export default function SettingsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = useFlash();
  const [tab, setTab] = useState<Tab>("hubs");
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [services, setServices] = useState<PlatformService[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingService, setPendingService] = useState<PlatformService | null>(null);
  const [serviceBusy, setServiceBusy] = useState(false);

  async function load() {
    const [h, s] = await Promise.all([
      api<Hub[]>("/api/v1/admin/hubs", { token }),
      api<PlatformService[]>("/api/v1/admin/services", { token }),
    ]);
    setHubs(h);
    setServices(s);
  }

  useEffect(() => {
    if (token) load().catch((e) => flash.fail(e, "Failed to load settings"));
  }, [token]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "hubs" || t === "services" || t === "fd-cards") setTab(t);
  }, [searchParams]);

  function selectTab(id: Tab) {
    setTab(id);
    router.replace(`/admin/settings?tab=${id}`, { scroll: false });
  }

  async function createHub(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<Hub>("/api/v1/admin/hubs", {
        token, method: "POST", holdLoader: true,
        body: JSON.stringify({ name, city, state, notes }),
      });
      openDetails(`/admin/settings/hubs/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create hub");
    }
  }

  async function confirmToggleService() {
    if (!pendingService) return;
    const svc = pendingService;
    const enabling = !svc.enabled;
    setServiceBusy(true);
    try {
      await api(`/api/v1/admin/services/${svc.code}`, {
        token, method: "PATCH", body: JSON.stringify({ enabled: enabling }),
      });
      setPendingService(null);
      await load();
      flash.ok(`${svc.name} is now ${enabling ? "enabled" : "disabled"} across the network.`);
    } catch (e) {
      flash.fail(e, "Could not update service");
    } finally {
      setServiceBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Create hub geographies when you need them, and choose which rails retailers may use."
        actions={tab === "hubs" ? <button className="btn-primary" onClick={() => setOpen(true)}>Add hub</button> : undefined}
      />
      <div className="flex flex-wrap gap-2">
        {([
          ["hubs", "Hubs"],
          ["services", "Services"],
          ["fd-cards", "FD Cards"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "btn-primary" : "btn-secondary"}
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Flash message={flash.message} error={flash.error} />

      {tab === "hubs" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Hubs" value={String(hubs.length)} hint="Geographies distributors sit on" icon={<MapPin className="h-5 w-5" />} />
            <StatCard label="Active" value={String(hubs.filter((h) => h.status === "ACTIVE").length)} />
          </div>
          {hubs.length === 0 ? (
            <EmptyState title="No hubs yet" body="Add a hub when you are ready to appoint distributors to a geography." />
          ) : (
            <DataTable
              columns={["Hub", "City", "Distributors", "Admins", "Status", "Created by", "Created", ""]}
              rows={hubs.map((h) => [
                `${h.name} (${h.code})`,
                `${h.city}, ${h.state}`,
                String(h.distributor_count ?? 0),
                String(h.admin_count ?? 0),
                <StatusPill key={h.id} value={h.status} />,
                createdByLabel(h.created_by_name, h.created_by_code),
                h.created_at ? when(h.created_at) : "—",
                <ViewLink key={`${h.id}-v`} href={`/admin/settings/hubs/${h.id}`} />,
              ])}
            />
          )}
        </div>
      )}

      {tab === "fd-cards" && <FdCardsConsole token={token} />}

      {tab === "services" && (
        <div className="space-y-4">
          <StatCard label="Enabled rails" value={String(services.filter((s) => s.enabled).length)} hint={`${services.length} products on the platform`} icon={<ToggleLeft className="h-5 w-5" />} />
          <div className="grid gap-3">
            {services.map((svc) => (
              <div key={svc.code} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-navy-950">{svc.name}</p>
                  <p className="mt-1 text-sm text-navy-600">{svc.description}</p>
                </div>
                <button className={svc.enabled ? "btn-secondary" : "btn-primary"} onClick={() => setPendingService(svc)}>
                  {svc.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FormModal open={open} title="Create a hub" description="A unique GFIN hub code is assigned automatically (10 characters). Distributors and hub admins are appointed onto this geography." onClose={() => setOpen(false)} onSubmit={createHub} submitLabel="Create hub">
        <TextField label="Name" required value={name} onChange={setName} />
        <TextField label="City" required value={city} onChange={setCity} />
        <TextField label="State" required value={state} onChange={setState} />
        <TextField label="Notes" value={notes} onChange={setNotes} />
      </FormModal>

      <Modal
        open={pendingService != null}
        title={pendingService?.enabled ? "Disable service" : "Enable service"}
        description={
          pendingService?.enabled
            ? "Retailers will lose access to this rail immediately. APIs and desk shortcuts will stop working until you turn it back on."
            : "Retailers will see this rail in their desk and may start using it across the network."
        }
      >
        {pendingService && (
          <p className="text-sm font-semibold text-navy-950">
            {pendingService.name}
            <span className="mt-1 block text-xs font-normal text-navy-500">{pendingService.description}</span>
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={serviceBusy} onClick={() => setPendingService(null)}>
            Cancel
          </button>
          <button
            type="button"
            className={pendingService?.enabled ? "btn-secondary" : "btn-primary"}
            disabled={serviceBusy}
            onClick={confirmToggleService}
          >
            {serviceBusy
              ? "Saving…"
              : pendingService?.enabled
                ? "Yes, disable"
                : "Yes, enable"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
