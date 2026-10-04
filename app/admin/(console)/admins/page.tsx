"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Copy, 
  Key, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Users 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
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
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [hubId, setHubId] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const [all, hubRows] = await Promise.all([
        api<UserRow[]>("/api/v1/admin/users?type=ADMIN", { token }),
        api<Hub[]>("/api/v1/admin/hubs", { token }),
      ]);
      setAdmins(Array.isArray(all) ? all : []);
      setHubs(Array.isArray(hubRows) ? hubRows : []);
      if (!hubId && hubRows[0]) setHubId(hubRows[0].id);
    } catch (e) {
      flash.fail(e, "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
  }, [token]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedMobile(text);
    setTimeout(() => setCopiedMobile(null), 1800);
  }

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

  const metrics = useMemo(() => {
    const total = admins.length;
    const active = admins.filter((u) => u.status === "ACTIVE").length;
    const hubCount = hubs.length;
    return { total, active, hubCount };
  }, [admins, hubs]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          a.full_name.toLowerCase().includes(q) ||
          a.mobile.includes(q) ||
          (a.hub_name && a.hub_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [admins, statusFilter, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Role-Based Access
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Regional Hub Admins
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Designated operations administrators managing distributors, retailers, and reconciliation across assigned hubs.
          </p>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
          disabled={hubs.length === 0}
        >
          <Plus className="h-4 w-4" />
          Create Hub Admin
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Hub Admins"
          value={String(metrics.total)}
          hint="Regional ops personnel"
          icon={<Shield className="h-5 w-5" />}
        />
        <StatCard
          label="Active Staff"
          value={String(metrics.active)}
          hint="Authenticated for console access"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Supervised Hubs"
          value={String(metrics.hubCount)}
          hint="Covered geographies"
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Control Bar & Table */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  statusFilter === s
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {s === "ALL" ? "All Staff" : s}
              </button>
            ))}
          </div>

          <div className="relative min-w-[18rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name, Mobile, Hub..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            title="No administrators found"
            body={hubs.length === 0 ? "Configure a regional hub in Settings first." : "Add a hub admin to delegate regional territory oversight."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Assigned Territory</th>
                  <th className="px-6 py-4">Login Mobile</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-amber-300 font-bold text-sm shrink-0 ring-1 ring-slate-800">
                          {u.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{u.full_name}</p>
                          <span className="font-mono text-[11px] text-slate-400">Hub Operations</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-900">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{u.hub_name ?? "Unassigned Territory"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{maskMobile(u.mobile)}</span>
                        <button
                          type="button"
                          onClick={() => copy(u.mobile)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copy Mobile"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copiedMobile === u.mobile && (
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/admins/${u.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Permissions
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

      {/* Add Modal */}
      <FormModal
        open={open}
        title="Appoint Regional Hub Admin"
        description="Hub admins can view, approve, and manage downline networks exclusively in their assigned hub territory."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create Admin Account"
      >
        <TextField label="Full Name" required value={name} onChange={setName} />
        <TextField label="Mobile Number" required inputMode="numeric" value={mobile} onChange={setMobile} />
        <SelectField
          label="Assigned Territory Hub"
          required
          value={hubId}
          onChange={setHubId}
          options={hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))}
        />
        <TextField label="Initial Password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
    </div>
  );
}
