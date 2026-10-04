"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            System Configuration
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Platform Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage hub territories, active service rails (DMT, AePS, BBPS, Cards), and banking provider configurations.
          </p>
        </div>

        {tab === "hubs" && (
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setOpen(true)}>
            <MapPin className="h-4 w-4" />
            Create Hub
          </button>
        )}
      </div>

      {/* Modern Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
        {([
          ["hubs", "Regional Hubs"],
          ["services", "Service Rails & Switches"],
          ["fd-cards", "FD Card Providers"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === id
                ? "bg-navy-950 text-white shadow-sm"
                : "text-slate-600 hover:text-navy-950 hover:bg-slate-200/60"
            }`}
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <Flash message={flash.message} error={flash.error} />

      {tab === "hubs" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Configured Hubs" value={String(hubs.length)} hint="Geographies on platform" icon={<MapPin className="h-5 w-5" />} />
            <StatCard label="Active Hubs" value={String(hubs.filter((h) => h.status === "ACTIVE").length)} hint="Receiving transactions" />
            <StatCard label="Assigned Distributors" value={String(hubs.reduce((acc, h) => acc + (Number(h.distributor_count) || 0), 0))} hint="Franchise leaders" />
          </div>

          {hubs.length === 0 ? (
            <EmptyState title="No hubs configured yet" body="Add a hub geography to start appointing regional distributors." />
          ) : (
            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Hub Geography</th>
                    <th className="px-6 py-4">City & State</th>
                    <th className="px-6 py-4">Distributors</th>
                    <th className="px-6 py-4">Admins</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hubs.map((h) => (
                    <tr key={h.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-xs shrink-0">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">{h.name}</p>
                            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {h.code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {h.city}, {h.state}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-navy-950 text-sm">{String(h.distributor_count ?? 0)}</span>
                        <span className="text-xs text-slate-400 ml-1">appointed</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-navy-950 text-sm">{String(h.admin_count ?? 0)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={h.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/settings/hubs/${h.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Manage Hub
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "fd-cards" && <FdCardsConsole token={token} />}

      {tab === "services" && (
        <div className="space-y-6">
          <StatCard
            label="Active Rails"
            value={`${services.filter((s) => s.enabled).length} of ${services.length}`}
            hint="Live across all outlets"
            icon={<ToggleLeft className="h-5 w-5" />}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((svc) => (
              <div
                key={svc.code}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {svc.code}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      svc.enabled ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${svc.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {svc.enabled ? "Enabled Live" : "Disabled"}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-lg text-navy-950">{svc.name}</h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{svc.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Network availability</span>
                  <button
                    type="button"
                    onClick={() => setPendingService(svc)}
                    className={svc.enabled ? "btn-secondary !text-xs !py-1.5" : "btn-primary !text-xs !py-1.5"}
                  >
                    {svc.enabled ? "Disable Rail" : "Enable Rail"}
                  </button>
                </div>
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
