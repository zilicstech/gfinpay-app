"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  FileSpreadsheet,
  Globe2,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Unlock,
  User,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { isSuperAdminOrPlatformAdmin, useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, useFlash } from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import type { Hub, UserDetail, UserRow } from "@/features/admin/types";

type AdminModal = "hub" | "password" | "inactivate" | "activate" | null;

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useSession((s) => s.token);
  const currentUserType = useSession((s) => s.user?.userType);
  const currentUserId = useSession((s) => s.user?.id);
  const flash = useFlash();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubId, setHubId] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState<AdminModal>(null);

  // Tabs
  const [tab, setTab] = useState<string>("territory");

  // Copy feedback
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const viewerCanManageAdmins = isSuperAdminOrPlatformAdmin(currentUserType);

  async function load() {
    const [u, h] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setUser(u);
    setHubs(Array.isArray(h) ? h : []);
    setHubId(u.hub_id ?? "");

    // Set initial tab based on role
    if (u.user_type === "HUBADMIN") {
      setTab("territory");
    } else {
      setTab("privileges");
    }
  }

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load administrator")));
    }
  }, [token, id]);

  async function patchStatus(status: string) {
    try {
      const updated = await api<UserDetail>(`/api/v1/admin/users/${id}/status`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setUser(updated);
      setModal(null);
      flash.ok(`Administrator is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function saveHub(e: FormEvent) {
    e.preventDefault();
    try {
      const updated = await api<UserDetail>(`/api/v1/admin/users/${id}/hub`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ hubId }),
      });
      setUser(updated);
      setModal(null);
      flash.ok("Hub assignment updated successfully.");
    } catch (e) {
      flash.fail(e, "Could not assign hub");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, {
        token,
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setModal(null);
      flash.ok("Password reset successfully. Share credentials out of band.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  function copy(text: string, type: "mobile" | "code" | "email") {
    navigator.clipboard.writeText(text);
    if (type === "mobile") {
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 1600);
    } else if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1600);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Link
          href="/admin/admins"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Admins
        </Link>
        <Alert tone="error">{loadError}</Alert>
      </div>
    );
  }
  if (!user) return <div className="card h-48 animate-pulse bg-slate-100 rounded-[2.5rem]" />;

  const isSuper = user.user_type === "SUPER_ADMIN";
  const isPlatform = user.user_type === "ADMIN";
  const isHub = user.user_type === "HUBADMIN";
  const isSelf = currentUserId === user.id;
  const canResetPassword = isSelf || (viewerCanManageAdmins && !isSuper);
  const canChangeStatus = viewerCanManageAdmins && !isSuper && !isSelf;

  const hubLine = [user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ");
  const distributorsList = user.distributors ?? [];
  const assignedHubsList = user.assignedHubs ?? (user.hub_id ? [{
    id: user.hub_id,
    name: user.hub_name ?? "Assigned Hub",
    code: user.hub_code ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    status: "ACTIVE",
  } as Hub] : []);

  // Actions for ManageMenu
  const manageActions: ManageAction[] = [];

  if (isHub) {
    manageActions.push({
      label: "Change Hub Territory",
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => setModal("hub"),
    });
  }

  if (canResetPassword) {
    manageActions.push({
      label: "Reset Password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    });
  }

  if (canChangeStatus) {
    if (user.status === "ACTIVE") {
      manageActions.push({
        label: "Inactivate Account",
        icon: <UserX className="h-4 w-4" />,
        tone: "danger",
        onClick: () => setModal("inactivate"),
      });
    } else {
      manageActions.push({
        label: "Restore Access",
        icon: <Unlock className="h-4 w-4" />,
        onClick: () => setModal("activate"),
      });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/admins"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Admins
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Luxury Dark Hero Card aligned with Distributor Details */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-bold tracking-wider text-xs uppercase px-2.5 py-0.5 rounded-full ${
                  isSuper
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : isPlatform
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {isSuper ? "Super Administrator" : isPlatform ? "Platform Administrator" : "Hub Administrator"}
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* Scope / Territory Line */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              {isSuper ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-200">
                    Platform Owner & Root Administrator (Full System Authority)
                  </span>
                </>
              ) : isPlatform ? (
                <>
                  <Globe2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="font-medium text-slate-200">
                    Platform-wide Console Governance (All Geographies & Hubs)
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200">{hubLine || "Unassigned Territory Hub"}</span>
                </>
              )}
            </div>

            {/* Row 1: GFINCODE & PHONE & EMAIL with copy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{user.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy Admin Code"
                    onClick={() => copy(user.code!, "code")}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={() => copy(user.mobile, "mobile")}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedMobile && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>

              {user.email && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{user.email}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copy Email"
                    onClick={() => copy(user.email!, "email")}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedEmail && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}
            </div>

            {/* Row 2: Time and User who created it */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Appointed {when(user.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  By{" "}
                  <span className="font-medium text-white">
                    {user.created_by_name || user.created_by || "Platform Super Admin"}
                  </span>
                  {user.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({user.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
        {isHub ? (
          <>
            <button
              type="button"
              onClick={() => setTab("territory")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "territory"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Assigned Hub & Territory
            </button>
            <button
              type="button"
              onClick={() => setTab("distributors")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "distributors"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Appointed Distributors
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  tab === "distributors"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {distributorsList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "profile"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Profile & Security
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setTab("privileges")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "privileges"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              Console Privileges & Scope
            </button>
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "profile"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Profile & Security
            </button>
          </>
        )}
      </div>

      {/* Tab 1 (Hub Admin): Assigned Hub & Territory */}
      {isHub && tab === "territory" && (
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-950 font-display">Assigned Hub Geography</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                This administrator is authorized to supervise distributors and retailer outlets in the following hub territories.
              </p>
            </div>

            {assignedHubsList.length === 0 ? (
              <EmptyState
                title="No assigned hub"
                body="Assign this operator to a regional hub territory from the actions menu."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {assignedHubsList.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-500/25 shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-navy-950 text-sm">{h.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {h.code}
                            </span>
                            <span className="text-xs text-slate-500">
                              {h.city}, {h.state}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusPill value={h.status ?? "ACTIVE"} />
                    </div>

                    <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Operating Territory: <strong className="text-navy-900">{h.city}</strong>
                      </span>
                      <Link
                        href={`/admin/settings/hubs/${h.id}`}
                        className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Hub Details
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2 (Hub Admin): Appointed Distributors */}
      {isHub && tab === "distributors" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-navy-950 font-display">Appointed Distributors</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Master distributors operating in this administrator&apos;s assigned territory hubs.
              </p>
            </div>
            <Link
              href="/admin/distributors"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              All Distributors
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {distributorsList.length === 0 ? (
            <EmptyState
              title="No distributors found in this hub"
              body="Distributors appointed to this hub will appear here automatically."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Distributor</th>
                    <th className="px-6 py-4">Hub Territory</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Downline Outlets</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distributorsList.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{d.full_name}</p>
                          <span className="font-mono text-xs text-slate-500">{d.code ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700">{d.hub_name ?? "Assigned Hub"}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {maskMobile(d.mobile)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {d.retailer_count ?? 0} Retailers
                        </span>
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

      {/* Tab 1 (Platform / Super Admin): Console Privileges & Scope */}
      {!isHub && tab === "privileges" && (
        <div className="space-y-6">
          {/* Executive Metrics Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supervised Hubs</span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-navy-950">
                {user.platformStats?.totalHubs ?? hubs.length}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Active regional territories</span>
                <Link href="/admin/settings" className="font-bold text-emerald-600 hover:underline">
                  Manage Hubs →
                </Link>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Master Distributors</span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-navy-950">
                {user.platformStats?.totalDistributors ?? "—"}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Franchise leaders</span>
                <Link href="/admin/distributors" className="font-bold text-emerald-600 hover:underline">
                  Distributor Desk →
                </Link>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Retail Outlets</span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-navy-950">
                {user.platformStats?.totalRetailers ?? "—"}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Active agent network</span>
                <Link href="/admin/retailers" className="font-bold text-emerald-600 hover:underline">
                  Retailer Desk →
                </Link>
              </div>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950 font-display">Console Privileges & System Scope</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSuper
                  ? "As the Super Administrator, this user has unrestricted root authority across all platform modules."
                  : "Platform Administrators possess complete executive authority with delegation to appoint regional Hub Admins."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <Globe2 className="h-4 w-4 text-sky-600" />
                  Full Territory Oversight
                </div>
                <p className="text-xs text-slate-600">
                  Unrestricted access across all hubs without geographical confinement.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Hub Admin Management
                </div>
                <p className="text-xs text-slate-600">
                  Authorized to provision and assign regional Hub Admins to operating hubs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <Wallet className="h-4 w-4 text-indigo-600" />
                  Financial Governance
                </div>
                <p className="text-xs text-slate-600">
                  Float allocations, ledger verification, wallet adjustments, and settlement reviews.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                  Reconciliation & Audit
                </div>
                <p className="text-xs text-slate-600">
                  Provider MIS ingestion, variance resolution, and transaction audit trails.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  Infrastructure & Settings
                </div>
                <p className="text-xs text-slate-600">
                  Configure regional hubs, enable/disable platform services, and manage card SKUs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1.5 text-navy-950 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  {isSuper ? "Super Admin Governance" : "Platform Executive Role"}
                </div>
                <p className="text-xs text-slate-600">
                  {isSuper
                    ? "Single root super administrator governing all platform administrators."
                    : "Platform admin can only create hub admins not other platform admins."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profile & Security */}
      {tab === "profile" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-navy-950 font-display">Profile & Security Credentials</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Account parameters, identity verification, and security credentials.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 p-5 space-y-3 bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Identity Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-navy-950">{user.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">GFIN Admin Code</span>
                  <span className="font-mono font-semibold text-navy-950">{user.code ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Registered Mobile</span>
                  <span className="font-mono text-navy-950">{user.mobile}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Contact Email</span>
                  <span className="text-navy-950">{user.email ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Account Status</span>
                  <StatusPill value={user.status} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-5 space-y-3 bg-slate-50/40">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Security & Authentication</h3>
              <p className="text-xs text-slate-600">
                Credentials are encrypted using industry-standard BCrypt. Access can be revoked instantly by suspending the account.
              </p>

              <div className="pt-3 space-y-2">
                {canResetPassword && (
                  <button
                    type="button"
                    onClick={() => setModal("password")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 text-white px-4 py-2.5 text-xs font-bold hover:bg-navy-900 transition-colors shadow-xs"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset Account Password
                  </button>
                )}

                {canChangeStatus && (
                  user.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => setModal("inactivate")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      <UserX className="h-4 w-4" />
                      Suspend Administrator Access
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModal("activate")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      <Unlock className="h-4 w-4" />
                      Restore Administrator Access
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Hub Modal */}
      <FormModal
        open={modal === "hub"}
        title="Change Assigned Hub"
        description="Reassign this Hub Administrator to a different operating territory."
        onClose={() => setModal(null)}
        onSubmit={saveHub}
        submitLabel="Save Assignment"
      >
        <SelectField
          label="Hub Geography"
          required
          value={hubId}
          onChange={setHubId}
          options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))}
        />
      </FormModal>

      {/* Reset Password Modal */}
      <FormModal
        open={modal === "password"}
        title="Reset Administrator Password"
        description="Provision a new secure password for this administrator account."
        onClose={() => setModal(null)}
        onSubmit={resetPassword}
        submitLabel="Update Password"
        submitDisabled={!password || password.length < 8}
      >
        <TextField
          label="New Password"
          required
          type="password"
          value={password}
          onChange={setPassword}
        />
      </FormModal>

      {/* Inactivate Modal */}
      <FormModal
        open={modal === "inactivate"}
        title="Suspend Administrator Account"
        description="This administrator will immediately lose access to the console until access is restored."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          patchStatus("SUSPENDED");
        }}
        submitLabel="Suspend Access"
      >
        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
          Warning: Active sessions for this administrator will be invalidated upon token expiry.
        </p>
      </FormModal>

      {/* Activate Modal */}
      <FormModal
        open={modal === "activate"}
        title="Restore Administrator Access"
        description="Re-enable access to the administrative console for this staff member."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          patchStatus("ACTIVE");
        }}
        submitLabel="Restore Access"
      >
        <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
          The administrator will be able to sign in immediately using their existing credentials.
        </p>
      </FormModal>
    </div>
  );
}
