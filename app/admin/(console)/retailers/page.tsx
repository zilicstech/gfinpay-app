"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Store, 
  Users 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import type { UserRow } from "@/features/admin/types";

export default function RetailersPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [retailers, setRetailers] = useState<UserRow[]>([]);
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "PENDING_KYC" | "SUSPENDED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RetailerDraft>(emptyRetailerDraft);
  const [distributorId, setDistributorId] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([
        api<UserRow[]>("/api/v1/admin/users?type=RETAILER", { token }),
        api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
      ]);
      setRetailers(Array.isArray(r) ? r : []);
      setDistributors(Array.isArray(d) ? d : []);
      if (!distributorId && d[0]) setDistributorId(d[0].id);
    } catch (e) {
      flash.fail(e, "Failed to load retailers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
  }, [token]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<UserRow>("/api/v1/admin/users/retailers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          password: draft.password,
          email: `${draft.mobile}@gfinpay.com`,
          distributorId,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`/admin/retailers/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create retailer");
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = retailers.length;
    const active = retailers.filter((r) => r.status === "ACTIVE").length;
    const verifiedKyc = retailers.filter((r) => r.kyc_status === "VERIFIED").length;
    const pendingKyc = retailers.filter((r) => r.kyc_status !== "VERIFIED").length;
    return { total, active, verifiedKyc, pendingKyc };
  }, [retailers]);

  const filteredRetailers = useMemo(() => {
    return retailers.filter((r) => {
      if (statusTab === "ACTIVE" && r.status !== "ACTIVE") return false;
      if (statusTab === "PENDING_KYC" && r.kyc_status === "VERIFIED") return false;
      if (statusTab === "SUSPENDED" && r.status !== "SUSPENDED") return false;

      if (query) {
        const q = query.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
          (r.parent_name && r.parent_name.toLowerCase().includes(q)) ||
          (r.hub_name && r.hub_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [retailers, statusTab, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Distribution Network
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Retailer Outlets
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage point-of-sale BC merchants, KYC compliance, wallet floats, and distributor mapping.
          </p>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
          disabled={distributors.length === 0}
        >
          <Plus className="h-4 w-4" />
          Onboard New Retailer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Outlets"
          value={String(metrics.total)}
          hint="Enrolled BC counters"
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Active Counters"
          value={String(metrics.active)}
          hint="Operating in field"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Verified eKYC"
          value={String(metrics.verifiedKyc)}
          hint="Compliant with RBI norms"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Review"
          value={String(metrics.pendingKyc)}
          hint="Requires verification"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Outlets"],
              ["ACTIVE", "Active Only"],
              ["PENDING_KYC", "Pending KYC"],
              ["SUSPENDED", "Suspended"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusTab(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  statusTab === key
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[18rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name, Code, Phone, Hub..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Master Table */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRetailers.length === 0 ? (
          <EmptyState
            title="No retailers found"
            body={query || statusTab !== "ALL" ? "Try clearing search filters." : "Onboard a retailer under a distributor to populate this network list."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Outlet Merchant</th>
                  <th className="px-6 py-4">Parent Distributor</th>
                  <th className="px-6 py-4">Hub Geography</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">eKYC</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRetailers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm shrink-0 ring-1 ring-indigo-200/60">
                          {u.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{u.full_name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {u.code ?? "—"}
                            </span>
                            {u.code && (
                              <button
                                type="button"
                                onClick={() => copy(u.code!)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                            {copiedId === u.code && (
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-navy-900 text-xs sm:text-sm">
                          {u.parent_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600 font-medium">
                          {u.hub_name ?? "Default Hub"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {maskMobile(u.mobile)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <EkycBadge status={u.kyc_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/retailers/${u.id}`}
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

      {/* Onboarding Modal */}
      <FormModal
        open={open}
        title="Onboard New Retailer"
        description="Place a retailer under an authorized master distributor. Live services activate upon credentials assignment."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create Outlet & Proceed"
        submitDisabled={!retailerDraftReady(draft) || !distributorId}
      >
        <SelectField
          label="Appoint Under Distributor"
          required
          value={distributorId}
          onChange={setDistributorId}
          options={distributors.map((d) => ({
            value: d.id,
            label: `${d.full_name} (${d.code ?? d.mobile})`,
          }))}
        />
        <RetailerOnboardFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
