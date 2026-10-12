"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock,
  Copy,
  FileText,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Unlock,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Modal, StatusPill } from "@/components/ui/primitives";
import {
  DirectoryAssignModal,
  Flash,
  FormModal,
  TextField,
  useFlash,
} from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import type { AdminDirectoryRow, DistributorDirectoryRow, Hub } from "@/features/admin/types";

type ModalType = "edit" | "suspend" | "activate" | "add-distributor" | "add-admin" | null;
type TabType = "details" | "admins" | "distributors";

export default function HubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [hub, setHub] = useState<Hub | null>(null);
  const [tab, setTab] = useState<TabType>("details");
  const [modal, setModal] = useState<ModalType>(null);

  // Edit fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  // Directory assign modal state
  const [distributorDir, setDistributorDir] = useState<DistributorDirectoryRow[]>([]);
  const [adminDir, setAdminDir] = useState<AdminDirectoryRow[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<Set<string>>(new Set());
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [dirLoading, setDirLoading] = useState(false);

  // Local table search queries
  const [distributorQuery, setDistributorQuery] = useState("");
  const [adminQuery, setAdminQuery] = useState("");

  // Copy feedback states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDistCode, setCopiedDistCode] = useState<string | null>(null);
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

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

  async function copyCode() {
    if (!hub?.code) return;
    await navigator.clipboard.writeText(hub.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  function copyText(text: string, setter: (val: string | null) => void) {
    navigator.clipboard.writeText(text);
    setter(text);
    setTimeout(() => setter(null), 1600);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      setHub(
        await api<Hub>(`/api/v1/admin/hubs/${id}`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ name, city, state, notes }),
        })
      );
      setModal(null);
      flash.ok("Hub updated successfully.");
    } catch (e) {
      flash.fail(e, "Could not update hub");
    }
  }

  async function setStatus(status: string) {
    try {
      setHub(
        await api<Hub>(`/api/v1/admin/hubs/${id}`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
      );
      setModal(null);
      flash.ok(`Hub territory is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not change hub status");
    }
  }

  async function assignDistributors(e: FormEvent) {
    e.preventDefault();
    const userIds = [...selectedDistributors];
    if (!userIds.length) return;
    try {
      setHub(
        await api<Hub>(`/api/v1/admin/hubs/${id}/distributors/assign`, {
          token,
          method: "POST",
          body: JSON.stringify({ userIds }),
        })
      );
      setModal(null);
      flash.ok(
        userIds.length === 1 ? "Distributor added to hub." : `${userIds.length} distributors added to hub.`
      );
    } catch (e) {
      flash.fail(e, "Could not assign distributors");
    }
  }

  async function assignAdmins(e: FormEvent) {
    e.preventDefault();
    const userIds = [...selectedAdmins];
    if (!userIds.length) return;
    try {
      setHub(
        await api<Hub>(`/api/v1/admin/hubs/${id}/admins/assign`, {
          token,
          method: "POST",
          body: JSON.stringify({ userIds }),
        })
      );
      setModal(null);
      flash.ok(userIds.length === 1 ? "Admin assigned to hub." : `${userIds.length} admins assigned to hub.`);
    } catch (e) {
      flash.fail(e, "Could not assign admins");
    }
  }

  const filteredDistributors = useMemo(() => {
    if (!hub?.distributors) return [];
    if (!distributorQuery) return hub.distributors;
    const q = distributorQuery.toLowerCase();
    return hub.distributors.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        d.mobile.includes(q)
    );
  }, [hub?.distributors, distributorQuery]);

  const filteredAdmins = useMemo(() => {
    if (!hub?.admins) return [];
    if (!adminQuery) return hub.admins;
    const q = adminQuery.toLowerCase();
    return hub.admins.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        a.mobile.includes(q)
    );
  }, [hub?.admins, adminQuery]);

  if (!hub) return <div className="card h-48 animate-pulse bg-slate-100" />;

  const isHubActive = hub.status === "ACTIVE";

  const manageActions: ManageAction[] = [
    {
      label: "Edit hub",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setModal("edit"),
    },
    {
      label: "Add distributor",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => setModal("add-distributor"),
    },
    {
      label: "Assign admin",
      icon: <ShieldCheck className="h-4 w-4" />,
      onClick: () => setModal("add-admin"),
    },
    isHubActive
      ? {
          label: "Suspend hub",
          icon: <Lock className="h-4 w-4" />,
          onClick: () => setModal("suspend"),
          tone: "danger" as const,
        }
      : {
          label: "Activate hub",
          icon: <Unlock className="h-4 w-4" />,
          onClick: () => setModal("activate"),
        },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/settings?tab=hubs"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Hubs
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Hero Profile Card - Aligned with distributor details UX */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            {/* Badges line */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Regional Hub
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={hub.status} />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {hub.name}
              </h1>
            </div>

            {/* Territory Row */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">
                {hub.city}, {hub.state}
              </span>
            </div>

            {/* Row 1: Hub Code & Stats Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              {hub.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{hub.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy Hub Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{hub.distributors?.length ?? 0} Master Distributors</span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Shield className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{hub.admins?.length ?? 0} Operators</span>
              </span>
            </div>

            {/* Row 2: Creation Details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{when(hub.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-white">
                    {hub.created_by_name || hub.created_by || "Platform Admin"}
                  </span>
                  {hub.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({hub.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          {/* Manage Button Menu */}
          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Modern Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
        {([
          ["details", "Hub Details"],
          ["admins", `Hub Operators (${hub.admins?.length ?? 0})`],
          ["distributors", `Distributors (${hub.distributors?.length ?? 0})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === key
                ? "bg-navy-950 text-white shadow-sm"
                : "text-slate-600 hover:text-navy-950 hover:bg-slate-200/60"
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: HUB DETAILS */}
      {tab === "details" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Territory Geographic Card */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-navy-950">Territory Jurisdiction</h3>
                <p className="text-xs text-slate-500">Official geographical boundary for this hub.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">City</p>
                <p className="font-display font-bold text-base text-navy-950 mt-1">{hub.city}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">State</p>
                <p className="font-display font-bold text-base text-navy-950 mt-1">{hub.state}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Country</p>
                <p className="font-display font-bold text-base text-navy-950 mt-1">India</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusPill value={hub.status} />
                </div>
              </div>
            </div>

            {/* Operating Notes */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operating Notes</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {hub.notes?.trim() ? hub.notes : "No special operational notes recorded for this hub."}
              </p>
            </div>
          </div>

          {/* Operational Distribution Card */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-navy-950">Capacity & Assignment</h3>
                <p className="text-xs text-slate-500">Live operational strength assigned to this hub.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Appointed Distributors</p>
                <p className="font-display font-bold text-2xl text-navy-950 mt-1">{hub.distributors?.length ?? 0}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Master leaders</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Admins</p>
                <p className="font-display font-bold text-2xl text-navy-950 mt-1">{hub.admins?.length ?? 0}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Staff operators</p>
              </div>
            </div>

            {/* Audit Line */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Audit & Provenance</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>
                  <strong>Created:</strong> {when(hub.created_at)}
                </p>
                <p>
                  <strong>Created By:</strong> {hub.created_by_name || hub.created_by || "Platform Admin"}
                  {hub.created_by_code && ` (${hub.created_by_code})`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HUB OPERATORS / ADMINS */}
      {tab === "admins" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Assigned Hub Operators</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff members and regional operators granted administrative control over {hub.name}.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              onClick={() => setModal("add-admin")}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Assign Admin</span>
            </button>
          </div>

          {hub.admins && hub.admins.length > 0 && (
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={adminQuery}
                onChange={(e) => setAdminQuery(e.target.value)}
                placeholder="Search operators on this hub..."
                className="field !pl-10 !py-2 text-xs w-full"
              />
            </div>
          )}

          {!hub.admins || hub.admins.length === 0 ? (
            <div className="space-y-4 text-center py-6">
              <EmptyState
                title="No hub operators assigned"
                body="Assign an admin from the staff directory to oversee operations in this territory."
              />
              <button
                type="button"
                className="btn-primary text-xs inline-flex items-center gap-1.5"
                onClick={() => setModal("add-admin")}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Assign First Admin</span>
              </button>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <EmptyState title="No matching operators" body="Try clearing your search query." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Admin Operator</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmins.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                            <Shield className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">{a.full_name}</p>
                            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {a.code ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs">
                          {a.email && (
                            <p className="font-medium text-slate-800">{a.email}</p>
                          )}
                          <p className="font-mono text-slate-500">{maskMobile(a.mobile)}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={a.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/admins/${a.id}`}
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

      {/* TAB 3: DISTRIBUTORS */}
      {tab === "distributors" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Appointed Master Distributors</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Regional franchise partners with downline outlets assigned under {hub.name}.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              onClick={() => setModal("add-distributor")}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Distributor</span>
            </button>
          </div>

          {hub.distributors && hub.distributors.length > 0 && (
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={distributorQuery}
                onChange={(e) => setDistributorQuery(e.target.value)}
                placeholder="Search distributors on this hub..."
                className="field !pl-10 !py-2 text-xs w-full"
              />
            </div>
          )}

          {!hub.distributors || hub.distributors.length === 0 ? (
            <div className="space-y-4 text-center py-6">
              <EmptyState
                title="No distributors appointed on this hub"
                body="Assign master distributors from your platform directory to start onboarding downline retailers."
              />
              <button
                type="button"
                className="btn-primary text-xs inline-flex items-center gap-1.5"
                onClick={() => setModal("add-distributor")}
              >
                <UserPlus className="h-4 w-4" />
                <span>Assign Master Distributor</span>
              </button>
            </div>
          ) : filteredDistributors.length === 0 ? (
            <EmptyState title="No matching distributors" body="Try clearing your search query." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Distributor</th>
                    <th className="px-6 py-4">Contact Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDistributors.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{d.full_name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {d.code ?? "—"}
                            </span>
                            {d.code && (
                              <button
                                type="button"
                                onClick={() => copyText(d.code!, setCopiedDistCode)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                            {copiedDistCode === d.code && (
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{maskMobile(d.mobile)}</span>
                          <button
                            type="button"
                            onClick={() => copyText(d.mobile, setCopiedMobile)}
                            className="text-slate-400 hover:text-slate-700 ml-0.5"
                            title="Copy Phone"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedMobile === d.mobile && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={d.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/distributors/${d.id}`}
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

      {/* EDIT HUB MODAL */}
      <FormModal
        open={modal === "edit"}
        title="Edit Hub Details"
        description="Update geography information and operating notes for this regional hub."
        onClose={() => setModal(null)}
        onSubmit={save}
        submitLabel="Save Changes"
      >
        <TextField label="Hub Name" required value={name} onChange={setName} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City" required value={city} onChange={setCity} />
          <TextField label="State" required value={state} onChange={setState} />
        </div>
        <TextField label="Operating Notes" value={notes} onChange={setNotes} />
      </FormModal>

      {/* SUSPEND MODAL */}
      <Modal
        open={modal === "suspend"}
        title="Suspend Hub Territory"
        description={`Are you sure you want to suspend ${hub.name}? New master distributors cannot be appointed onto this geography while suspended. Existing networks remain untouched.`}
      >
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className="btn-secondary text-xs" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs"
            onClick={() => setStatus("SUSPENDED")}
          >
            Suspend Territory
          </button>
        </div>
      </Modal>

      {/* ACTIVATE MODAL */}
      <Modal
        open={modal === "activate"}
        title="Activate Hub Territory"
        description={`Reactivate ${hub.name}? This will reopen the territory for appointing master distributors and assigning operators.`}
      >
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className="btn-secondary text-xs" onClick={() => setModal(null)}>
            Cancel
          </button>
          <button type="button" className="btn-primary text-xs" onClick={() => setStatus("ACTIVE")}>
            Activate Territory
          </button>
        </div>
      </Modal>

      {/* DIRECTORY ASSIGN: DISTRIBUTOR */}
      <DirectoryAssignModal
        open={modal === "add-distributor"}
        title="Appoint Distributors to Hub"
        description="Select distributors to assign to this hub geography. Moving a distributor from another hub also shifts their downline retail outlets."
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
        emptyTitle="No distributors available in directory. Create one from the Distributors page first."
        onToggle={(userId) => toggleSelected(setSelectedDistributors, userId)}
        onClose={() => setModal(null)}
        onSubmit={assignDistributors}
        submitLabel="Appoint to Hub"
      />

      {/* DIRECTORY ASSIGN: ADMIN */}
      <DirectoryAssignModal
        open={modal === "add-admin"}
        title="Assign Hub Operators"
        description="Select staff members from the admin directory to assign. An admin operator can manage multiple regional hubs."
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
        emptyTitle="No hub admins available in directory. Create one from the Admins page first."
        onToggle={(userId) => toggleSelected(setSelectedAdmins, userId)}
        onClose={() => setModal(null)}
        onSubmit={assignAdmins}
        submitLabel="Assign to Hub"
      />
    </div>
  );
}
