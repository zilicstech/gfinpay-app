"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Copy,
  MapPin,
  Plus,
  Search,
  Sliders,
  ToggleLeft,
  Users,
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import { FdCardsConsole } from "@/features/admin/FdCardsConsole";
import { BanksDesk } from "@/features/finance/BanksDesk";
import { DmtBanksConsole } from "@/features/admin/DmtBanksConsole";
import type { Hub, PlatformService } from "@/features/admin/types";

type Tab = "hubs" | "services" | "fd-cards" | "banks" | "dmt-banks";

export default function SettingsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = useFlash();

  const [tab, setTab] = useState<Tab>("hubs");
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [services, setServices] = useState<PlatformService[]>([]);
  const [loading, setLoading] = useState(true);

  // Hub filters
  const [hubQuery, setHubQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Hub Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  // Service toggle modal
  const [pendingService, setPendingService] = useState<PlatformService | null>(null);
  const [serviceBusy, setServiceBusy] = useState(false);
  const [commission, setCommission] = useState<{
    code: string;
    name: string;
    mode: "FLAT" | "PERCENT";
    retailer: string;
    distributor: string;
    hub: string;
    vendorCommission?: string;
  } | null>(null);
  const [commissionBusy, setCommissionBusy] = useState(false);
  const [hospiPrice, setHospiPrice] = useState<{
    sellingPrice: string;
    discount: string;
  } | null>(null);
  const [hospiSaved, setHospiSaved] = useState<{
    sellingPrice: number;
    discount: number;
    payable: number;
    vendorCommission: number;
  } | null>(null);
  const [hospiBusy, setHospiBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [h, s, price] = await Promise.all([
        api<Hub[]>("/api/v1/admin/hubs", { token }),
        api<PlatformService[]>("/api/v1/admin/services", { token }),
        api<{ sellingPrice?: number; discount?: number; payable?: number; vendorCommission?: number }>(
          "/api/v1/admin/hospi-cash/pricing",
          { token },
        ).catch(() => null),
      ]);
      setHubs(Array.isArray(h) ? h : []);
      setServices(Array.isArray(s) ? s : []);
      if (price) {
        setHospiSaved({
          sellingPrice: Number(price.sellingPrice ?? 0),
          discount: Number(price.discount ?? 0),
          payable: Number(price.payable ?? 0),
          vendorCommission: Number(price.vendorCommission ?? 0),
        });
      }
    } catch (e) {
      flash.fail(e, "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "hubs" || t === "services" || t === "fd-cards" || t === "banks" || t === "dmt-banks") setTab(t);
  }, [searchParams]);

  function selectTab(id: Tab) {
    setTab(id);
    router.replace(`/admin/settings?tab=${id}`, { scroll: false });
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  async function createHub(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<Hub>("/api/v1/admin/hubs", {
        token,
        method: "POST",
        holdLoader: true,
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
        token,
        method: "PATCH",
        body: JSON.stringify({ enabled: enabling }),
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

  async function openCommission(code: string, name: string) {
    try {
      const current = await api<{
        mode?: string;
        retailer?: number | null;
        distributor?: number | null;
        hub?: number | null;
        vendorCommission?: number | null;
      }>(`/api/v1/admin/services/${code}/commission`, { token });
      setCommission({
        code,
        name,
        mode: current.mode === "PERCENT" ? "PERCENT" : "FLAT",
        retailer: String(current.retailer ?? 0),
        distributor: String(current.distributor ?? 0),
        hub: String(current.hub ?? 0),
        vendorCommission: code === "HOSPI_CASH" ? String(current.vendorCommission ?? 0) : undefined,
      });
    } catch (e) {
      flash.fail(e, "Could not load commission");
    }
  }

  function openHospiPrice() {
    setHospiPrice({
      sellingPrice: String(hospiSaved?.sellingPrice ?? 1000),
      discount: String(hospiSaved?.discount ?? 0),
    });
  }

  async function saveHospiPrice(e: FormEvent) {
    e.preventDefault();
    if (!hospiPrice) return;
    setHospiBusy(true);
    try {
      const saved = await api<{ sellingPrice?: number; discount?: number; payable?: number; vendorCommission?: number }>(
        "/api/v1/admin/hospi-cash/pricing",
        {
          token,
          method: "PUT",
          body: JSON.stringify({
            sellingPrice: Number(hospiPrice.sellingPrice || 0),
            discount: Number(hospiPrice.discount || 0),
          }),
        },
      );
      setHospiSaved({
        sellingPrice: Number(saved.sellingPrice ?? 0),
        discount: Number(saved.discount ?? 0),
        payable: Number(saved.payable ?? 0),
        vendorCommission: Number(saved.vendorCommission ?? 0),
      });
      setHospiPrice(null);
      flash.ok("Hospi Cash price saved. New sales use this amount.");
    } catch (err) {
      flash.fail(err, "Could not save the Hospi Cash price");
    } finally {
      setHospiBusy(false);
    }
  }

  async function saveCommission(e: FormEvent) {
    e.preventDefault();
    if (!commission) return;
    setCommissionBusy(true);
    try {
      const saved = await api<{ vendorCommission?: number }>(`/api/v1/admin/services/${commission.code}/commission`, {
        token,
        method: "PUT",
        body: JSON.stringify({
          mode: commission.mode,
          retailer: Number(commission.retailer || 0),
          distributor: Number(commission.distributor || 0),
          hub: Number(commission.hub || 0),
          ...(commission.code === "HOSPI_CASH"
            ? { vendorCommission: Number(commission.vendorCommission || 0) }
            : {}),
        }),
      });
      if (commission.code === "HOSPI_CASH") {
        setHospiSaved((current) =>
          current ? { ...current, vendorCommission: Number(saved.vendorCommission ?? 0) } : current,
        );
      }
      flash.ok(`Commission saved for ${commission.name}.`);
      setCommission(null);
    } catch (e) {
      flash.fail(e, "Could not save commission");
    } finally {
      setCommissionBusy(false);
    }
  }

  const filteredHubs = useMemo(() => {
    return hubs.filter((h) => {
      if (statusTab === "ACTIVE" && h.status !== "ACTIVE") return false;
      if (statusTab === "SUSPENDED" && h.status !== "SUSPENDED") return false;

      if (hubQuery) {
        const q = hubQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          (h.code && h.code.toLowerCase().includes(q)) ||
          h.city.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          (h.notes && h.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [hubs, statusTab, hubQuery]);

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
            Manage hub territories, service rails, FD card providers, collection accounts, and DMT banks.
          </p>
        </div>

        {tab === "hubs" && (
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Hub
          </button>
        )}
      </div>

      {/* Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
        {([
          ["hubs", `Regional Hubs (${hubs.length})`],
          ["services", `Service Rails (${services.filter((s) => s.enabled).length}/${services.length})`],
          ["fd-cards", "FD Card Providers"],
          ["banks", "Banks"],
          ["dmt-banks", "DMT Banks"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
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

      {/* TAB 1: REGIONAL HUBS */}
      {tab === "hubs" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          {/* Controls Bar: Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {([
                ["ALL", "All Hubs"],
                ["ACTIVE", "Active Only"],
                ["SUSPENDED", "Suspended"],
              ] as const).map(([key, label]) => {
                const isActive = statusTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusTab(key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-navy-950 text-white shadow-xs"
                        : "text-slate-600 hover:text-navy-950"
                    }`}
                  >
                    {label}
                    {isActive && ` (${filteredHubs.length})`}
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[18rem]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={hubQuery}
                onChange={(e) => setHubQuery(e.target.value)}
                placeholder="Search by Hub Name, Code, City, State..."
                className="field !pl-10 !py-2 text-xs w-full"
              />
            </div>
          </div>

          {/* Hubs Table */}
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filteredHubs.length === 0 ? (
            <EmptyState
              title="No hubs found"
              body={
                hubQuery || statusTab !== "ALL"
                  ? "Try clearing your search filters."
                  : "Add your first hub territory to begin appointing master distributors."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Hub Geography</th>
                    <th className="px-6 py-4">Territory</th>
                    <th className="px-6 py-4">Distributors</th>
                    <th className="px-6 py-4">Admins</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHubs.map((h) => (
                    <tr key={h.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0 ring-1 ring-inset ring-emerald-500/20">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">{h.name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {h.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copy(h.code)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Hub Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              {copiedCode === h.code && (
                                <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {h.city}, {h.state}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-navy-950 text-sm">
                          {String(h.distributor_count ?? 0)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">appointed</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-navy-950 text-sm">
                          {String(h.admin_count ?? 0)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">assigned</span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={h.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/settings/hubs/${h.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Manage
                          <ArrowRight className="h-3 w-3" />
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

      {/* TAB 2: SERVICE RAILS */}
      {tab === "services" && (
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="font-display text-xl font-bold text-navy-950">Active Transaction Rails</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control operational availability for services across all agent desks and retail counters.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                <ToggleLeft className="h-4 w-4 text-emerald-600" />
                <span>
                  {services.filter((s) => s.enabled).length} of {services.length} Rails Active
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-6">
              {services.map((svc) => (
                <div
                  key={svc.code}
                  className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 flex flex-col justify-between gap-4 transition-all hover:bg-white hover:shadow-md hover:border-slate-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {svc.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          svc.enabled
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            svc.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        {svc.enabled ? "Live in Desks" : "Disabled"}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-lg text-navy-950">{svc.name}</h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                    {svc.code === "HOSPI_CASH" && hospiSaved && (
                      <p className="mt-2 text-xs font-semibold text-navy-950">
                        {inr(hospiSaved.sellingPrice)}
                        {hospiSaved.discount > 0 ? ` · discount ${inr(hospiSaved.discount)} · collect ${inr(hospiSaved.payable)}` : ""}
                        {" · vendor "}
                        {inr(hospiSaved.vendorCommission)}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                      {svc.code === "HOSPI_CASH" && (
                        <button
                          type="button"
                          onClick={openHospiPrice}
                          className="text-xs font-bold text-navy-950 underline"
                        >
                          Set price
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openCommission(svc.code, svc.name)}
                        className="text-xs font-bold text-navy-950 underline"
                      >
                        Set commission
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingService(svc)}
                      className={
                        svc.enabled
                          ? "btn-secondary !text-xs !py-1.5 !px-3 font-semibold text-rose-700 hover:text-rose-800"
                          : "btn-primary !text-xs !py-1.5 !px-3 font-semibold"
                      }
                    >
                      {svc.enabled ? "Disable Rail" : "Enable Rail"}
                    </button>
                  </div>
                </div>
              ))}
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 flex flex-col justify-between gap-4">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    FD_CARD
                  </span>
                  <h4 className="mt-2 font-display font-bold text-lg text-navy-950">FD Card</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Reward credited when a fixed deposit card conversion succeeds.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => openCommission("FD_CARD", "FD Card")}
                    className="text-xs font-bold text-navy-950 underline"
                  >
                    Set commission
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FD CARD PROVIDERS */}
      {tab === "fd-cards" && <FdCardsConsole token={token} />}
      {tab === "banks" && <BanksDesk embedded />}
      {tab === "dmt-banks" && <DmtBanksConsole />}

      {/* CREATE HUB MODAL */}
      <FormModal
        open={open}
        title="Create Regional Hub"
        description="A unique GFIN hub code will be assigned automatically (10 alphanumeric characters). Master distributors and operators can be assigned to this geography."
        onClose={() => setOpen(false)}
        onSubmit={createHub}
        submitLabel="Create Hub"
      >
        <TextField label="Hub Name" required value={name} onChange={setName} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City" required value={city} onChange={setCity} />
          <TextField label="State" required value={state} onChange={setState} />
        </div>
        <TextField
          label="Operational Notes (Optional)"
          value={notes}
          onChange={setNotes}
        />
      </FormModal>

      <Modal
        open={hospiPrice != null}
        title="Hospi Cash price"
        description="New sales collect the selling price minus any discount."
      >
        {hospiPrice && (
          <form onSubmit={saveHospiPrice} className="space-y-4">
            <TextField
              label="Selling price (₹)"
              required
              inputMode="numeric"
              value={hospiPrice.sellingPrice}
              onChange={(sellingPrice) => setHospiPrice({ ...hospiPrice, sellingPrice })}
            />
            <TextField
              label="Discount (₹)"
              inputMode="numeric"
              value={hospiPrice.discount}
              onChange={(discount) => setHospiPrice({ ...hospiPrice, discount })}
            />
            <p className="text-xs text-slate-600">
              Customer pays {inr(Math.max(0, Number(hospiPrice.sellingPrice || 0) - Number(hospiPrice.discount || 0)))}.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary text-xs" disabled={hospiBusy} onClick={() => setHospiPrice(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-xs" disabled={hospiBusy}>{hospiBusy ? "Saving..." : "Save price"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={commission != null}
        title="Set commission"
        description="One reward for the whole service. Flat is rupees. Percentage is of the transaction amount. It is credited to the rewards wallet when the service succeeds."
      >
        {commission && (
          <form onSubmit={saveCommission} className="space-y-4">
            <p className="text-sm font-bold text-navy-950">{commission.name}</p>
            <div className="flex gap-2">
              {(["FLAT", "PERCENT"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCommission({ ...commission, mode })}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${commission.mode === mode ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-600"}`}
                >
                  {mode === "FLAT" ? "Flat amount" : "Percentage"}
                </button>
              ))}
            </div>
            <TextField label={commission.mode === "FLAT" ? "Retailer (₹)" : "Retailer (%)"} value={commission.retailer} onChange={(retailer) => setCommission({ ...commission, retailer })} />
            <TextField label={commission.mode === "FLAT" ? "Distributor (₹)" : "Distributor (%)"} value={commission.distributor} onChange={(distributor) => setCommission({ ...commission, distributor })} />
            <TextField label={commission.mode === "FLAT" ? "Hub (₹)" : "Hub (%)"} value={commission.hub} onChange={(hub) => setCommission({ ...commission, hub })} />
            {commission.code === "HOSPI_CASH" && (
              <>
                <TextField
                  label="Vendor commission (₹)"
                  inputMode="numeric"
                  value={commission.vendorCommission ?? "0"}
                  onChange={(vendorCommission) => setCommission({ ...commission, vendorCommission })}
                />
                <p className="text-xs text-slate-600">
                  Vendor commission is a flat amount. It is written when activation is Success and settled offline.
                </p>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary text-xs" disabled={commissionBusy} onClick={() => setCommission(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-xs" disabled={commissionBusy}>{commissionBusy ? "Saving..." : "Save commission"}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* SERVICE TOGGLE MODAL */}
      <Modal
        open={pendingService != null}
        title={pendingService?.enabled ? "Disable Platform Service" : "Enable Platform Service"}
        description={
          pendingService?.enabled
            ? "Retailers and agents will lose access to this rail immediately. Counter shortcuts and APIs will stop processing until enabled again."
            : "This rail will be activated network-wide. Agents will immediately see the service live in their counter desks."
        }
      >
        {pendingService && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <p className="text-sm font-bold text-navy-950">{pendingService.name}</p>
            <p className="text-xs text-slate-600">{pendingService.description}</p>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={serviceBusy}
            onClick={() => setPendingService(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              pendingService?.enabled
                ? "btn bg-rose-600 hover:bg-rose-700 text-white text-xs"
                : "btn-primary text-xs"
            }
            disabled={serviceBusy}
            onClick={confirmToggleService}
          >
            {serviceBusy
              ? "Saving…"
              : pendingService?.enabled
              ? "Yes, Disable Rail"
              : "Yes, Enable Rail"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
