"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Copy, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  ShieldCheck, 
  Store, 
  Wallet 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { createdByLabel, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import { retailerLocationLine } from "@/features/admin/retailer-location";
import type { OutletRow } from "@/features/desk/types";

export default function NetworkPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [rows, setRows] = useState<OutletRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "PENDING_KYC">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RetailerDraft>(emptyRetailerDraft);

  async function load() {
    setLoading(true);
    try {
      const data = await api<OutletRow[]>("/api/v1/desk/outlets", { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      flash.fail(e, "Failed to load outlets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboard") === "1") {
      setOpen(true);
    }
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<OutletRow>("/api/v1/desk/outlets", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          password: draft.password,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`/distributor/agents/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create retailer");
    }
  }

  const metrics = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "ACTIVE").length;
    const verified = rows.filter((r) => r.kyc_status === "VERIFIED").length;
    return { total, active, verified };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusTab === "ACTIVE" && r.status !== "ACTIVE") return false;
      if (statusTab === "PENDING_KYC" && r.kyc_status === "VERIFIED") return false;

      if (query) {
        const q = query.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
          (r.retailer_city && r.retailer_city.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rows, statusTab, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Retail Network
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Downline Retailers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your network outlets, distribute float, monitor eKYC, and track daily counter performance.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Retailer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Retailers"
          value={String(metrics.total)}
          hint="Enrolled in your downline"
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Active Counters"
          value={String(metrics.active)}
          hint="Operating retail desks"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="eKYC Verified"
          value={String(metrics.verified)}
          hint="Full compliance"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Control Bar & Table */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Outlets"],
              ["ACTIVE", "Active Only"],
              ["PENDING_KYC", "Pending KYC"],
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
              placeholder="Search by Name, Code, City, Phone..."
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
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No outlets found"
            body={query || statusTab !== "ALL" ? "Try clearing search filters." : "Onboard a retailer to start earning commission from their transactions."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Retailer Outlet</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">eKYC</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-sm shrink-0 ring-1 ring-emerald-300/60">
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
                            {copiedCode === u.code && (
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {retailerLocationLine({
                          city: u.retailer_city,
                          state: u.retailer_state,
                          pincode: u.retailer_pincode,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {maskMobile(u.mobile)}
                    </td>
                    <td className="px-6 py-4">
                      <EkycBadge status={u.kyc_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill value={u.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {u.created_at ? when(u.created_at) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/distributor/agents/${u.id}`}
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

      {/* Onboard Modal */}
      <FormModal
        open={open}
        title="Onboard Downline Retailer"
        description="Add an outlet merchant under your distributor agency. They will operate sales counters from their store."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create Outlet & Proceed"
        submitDisabled={!retailerDraftReady(draft)}
      >
        <RetailerOnboardFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
