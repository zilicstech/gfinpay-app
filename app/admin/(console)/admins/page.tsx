"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Building2, 
  Copy, 
  Globe2, 
  Plus, 
  Search 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { when } from "@/lib/format";
import { isSuperAdmin, useSession } from "@/stores/session.store";
import { EmptyState } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, useFlash } from "@/features/admin/AdminChrome";
import type { Hub, UserRow } from "@/features/admin/types";

type AdminTab = "PLATFORM_ADMIN" | "HUB_ADMIN" | "ACTIVE" | "SUSPENDED";

export default function AdminsPage() {
  const token = useSession((s) => s.token);
  const currentUserType = useSession((s) => s.user?.userType);
  const isPlatformAdmin = currentUserType === "ADMIN";
  const canAppointPlatformAdmin = isSuperAdmin(currentUserType);
  const router = useRouter();
  const flash = useFlash();

  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>(
    isSuperAdmin(currentUserType) ? "PLATFORM_ADMIN" : "HUB_ADMIN",
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [adminType, setAdminType] = useState<"HUBADMIN" | "ADMIN">("HUBADMIN");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [hubId, setHubId] = useState("");

  const tabSeeded = useRef(false);
  useEffect(() => {
    if (!currentUserType || tabSeeded.current) return;
    tabSeeded.current = true;
    setActiveTab(isSuperAdmin(currentUserType) ? "PLATFORM_ADMIN" : "HUB_ADMIN");
  }, [currentUserType]);

  async function refresh() {
    setLoading(true);
    try {
      const endpoint = isPlatformAdmin
        ? "/api/v1/admin/users?type=HUBADMIN"
        : "/api/v1/admin/users?type=ALL_ADMINS";
      const [allAdmins, hubRows] = await Promise.all([
        api<UserRow[]>(endpoint, { token }),
        api<Hub[]>("/api/v1/admin/hubs", { token }),
      ]);
      setAdmins(Array.isArray(allAdmins) ? allAdmins : []);
      setHubs(Array.isArray(hubRows) ? hubRows : []);
      if (!hubId && hubRows[0]) setHubId(hubRows[0].id);
    } catch (e) {
      flash.fail(e, "Failed to load administrators");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
  }, [token, isPlatformAdmin]);

  function copyCode(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const payload: Record<string, any> = {
        fullName: name.trim(),
        mobile: mobile.trim(),
        password,
        adminType: isPlatformAdmin ? "HUBADMIN" : adminType,
      };
      if (isPlatformAdmin || adminType === "HUBADMIN") {
        payload.hubId = hubId;
      }
      const created = await api<UserRow>("/api/v1/admin/users/admins", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify(payload),
      });
      openDetails(`/admin/admins/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create administrator");
    }
  }

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      // Platform admins can only view hub admins
      if (isPlatformAdmin && a.user_type !== "HUBADMIN") return false;

      if (activeTab === "PLATFORM_ADMIN" && a.user_type !== "ADMIN" && a.user_type !== "SUPER_ADMIN") return false;
      if (activeTab === "HUB_ADMIN" && a.user_type !== "HUBADMIN") return false;
      if (activeTab === "ACTIVE" && a.status !== "ACTIVE") return false;
      if (activeTab === "SUSPENDED" && a.status !== "SUSPENDED") return false;

      if (query) {
        const q = query.toLowerCase();
        return (
          a.full_name.toLowerCase().includes(q) ||
          (a.code && a.code.toLowerCase().includes(q)) ||
          (a.hub_name && a.hub_name.toLowerCase().includes(q)) ||
          (a.hub_names && a.hub_names.toLowerCase().includes(q)) ||
          (a.created_by_name && a.created_by_name.toLowerCase().includes(q)) ||
          a.user_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [admins, activeTab, query, isPlatformAdmin]);

  const defaultTab: AdminTab = isSuperAdmin(currentUserType) ? "PLATFORM_ADMIN" : "HUB_ADMIN";
  const tabOptions: readonly (readonly [AdminTab, string])[] = isSuperAdmin(currentUserType)
    ? ([
        ["PLATFORM_ADMIN", "Platform Admins"],
        ["HUB_ADMIN", "Hub Admins"],
        ["ACTIVE", "Active Only"],
        ["SUSPENDED", "Suspended"],
      ] as const)
    : ([
        ["HUB_ADMIN", "Hub Admins"],
        ["ACTIVE", "Active Only"],
        ["SUSPENDED", "Suspended"],
      ] as const);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header aligned with Distributors page */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Role-Based Access
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            {isPlatformAdmin ? "Hub Administrators" : "Platform Administrators"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isPlatformAdmin
              ? "Manage regional hub operations staff and their assigned territories."
              : "Manage platform-level executive administrators and regional hub operations staff."}
          </p>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => {
            setAdminType("HUBADMIN");
            setName("");
            setMobile("");
            setPassword("");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {isPlatformAdmin ? "Appoint Hub Admin" : "Appoint Admin"}
        </button>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {tabOptions.map(([key, label]) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-navy-950 text-white shadow-xs"
                      : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {label}
                  {isActive && ` (${filteredAdmins.length})`}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[18rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name, Code, Hub..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            title="No administrators found"
            body={query || activeTab !== defaultTab ? "Try clearing search filters." : "Appoint an administrator to delegate operations."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Hubs</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((u) => {
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/60 group">
                      {/* 1. Name */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-navy-950 text-sm">{u.full_name}</p>
                            {u.status === "SUSPENDED" && (
                              <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Suspended
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {u.code ?? "—"}
                            </span>
                            {u.code && (
                              <button
                                type="button"
                                onClick={() => copyCode(u.code!)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                            {copiedCode === u.code && (
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Hubs */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold text-navy-900 leading-relaxed">
                            {u.hub_names || u.hub_name || (u.user_type === "ADMIN" || u.user_type === "SUPER_ADMIN" ? "All Hubs (Platform-wide)" : "Unassigned Hub")}
                          </span>
                        </div>
                      </td>

                      {/* 3. Created By */}
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">
                            {u.created_by_name || u.created_by || "Platform Admin"}
                          </p>
                          {u.created_by_code && (
                            <span className="font-mono text-[10px] text-slate-400">{u.created_by_code}</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Created On */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.created_at ? when(u.created_at) : "—"}
                      </td>

                      {/* 5. Action */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/admins/${u.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Manage
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appoint Admin Modal */}
      <FormModal
        open={open}
        title={isPlatformAdmin ? "Appoint Hub Admin" : "Appoint Administrator"}
        description={
          isPlatformAdmin
            ? "Provision login credentials for regional hub governance and operations."
            : "Choose the administrative tier and provision login credentials for platform or regional hub governance."
        }
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel={
          isPlatformAdmin
            ? "Appoint Hub Admin"
            : adminType === "ADMIN"
            ? "Appoint Platform Admin"
            : "Appoint Hub Admin"
        }
        submitDisabled={!name || !mobile || !password || ((isPlatformAdmin || adminType === "HUBADMIN") && !hubId)}
      >
        <div className="space-y-4">
          {/* Admin Type Switcher - only for Super Admin */}
          {!isPlatformAdmin && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Admin Classification
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdminType("HUBADMIN")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    adminType === "HUBADMIN"
                      ? "border-navy-950 bg-navy-950 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`h-4 w-4 ${adminType === "HUBADMIN" ? "text-amber-400" : "text-amber-500"}`} />
                    <span className="font-semibold text-sm">Hub Admin</span>
                  </div>
                  <p className={`text-xs ${adminType === "HUBADMIN" ? "text-slate-300" : "text-slate-500"}`}>
                    Manages distributors and retailers in an assigned territory hub.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!canAppointPlatformAdmin}
                  onClick={() => setAdminType("ADMIN")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    !canAppointPlatformAdmin
                      ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                      : adminType === "ADMIN"
                      ? "border-navy-950 bg-navy-950 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Globe2 className={`h-4 w-4 ${adminType === "ADMIN" ? "text-sky-400" : "text-sky-500"}`} />
                      <span className="font-semibold text-sm">Platform Admin</span>
                    </div>
                    {!canAppointPlatformAdmin && (
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Super Only
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${adminType === "ADMIN" ? "text-slate-300" : "text-slate-500"}`}>
                    Full console powers across all hubs, can appoint Hub Admins.
                  </p>
                </button>
              </div>
              {!canAppointPlatformAdmin && (
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5">
                  Note: Only the Super Admin can appoint Platform Admins. Platform Admins can appoint Hub Admins.
                </p>
              )}
            </div>
          )}

          <TextField label="Full Name" required value={name} onChange={setName} />
          <TextField label="Mobile Number" required inputMode="numeric" value={mobile} onChange={setMobile} />

          {(isPlatformAdmin || adminType === "HUBADMIN") && (
            <SelectField
              label="Assigned Territory Hub"
              required
              value={hubId}
              onChange={setHubId}
              options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))}
            />
          )}

          <TextField label="Initial Password" required type="password" value={password} onChange={setPassword} />
        </div>
      </FormModal>
    </div>
  );
}
