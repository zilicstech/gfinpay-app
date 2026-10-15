"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  BadgeCheck,
  Building2, 
  Copy, 
  Plus, 
  Search, 
  ShieldAlert 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, useFlash } from "@/features/admin/AdminChrome";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import type { OutletRow } from "@/features/desk/types";

export default function NetworkPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [retailers, setRetailers] = useState<OutletRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE" | "SUSPENDED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RetailerDraft>(emptyRetailerDraft);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api<OutletRow[]>("/api/v1/desk/outlets", { token });
      setRetailers(Array.isArray(data) ? data : []);
    } catch (e) {
      flash.fail(e, "Failed to load retailers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
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
          email: draft.email.trim(),
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

  const filteredRetailers = useMemo(() => {
    return retailers.filter((r) => {
      if (statusTab !== "ALL" && r.status !== statusTab) return false;

      if (query) {
        const q = query.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
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
            Retailers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create retailer profiles, then submit an activation payment for finance review before the outlet can go live.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Retailer
        </button>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All"],
              ["PENDING", "Pending"],
              ["SUBMITTED", "Submitted"],
              ["APPROVED", "Approved"],
              ["REJECTED", "Rejected"],
              ["ACTIVE", "Active"],
              ["INACTIVE", "Inactive"],
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
                  {isActive && ` (${filteredRetailers.length})`}
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
            body={query || statusTab !== "ALL" ? "Try clearing search filters." : "Create a retailer profile. Activation happens after payment is verified."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Hub</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRetailers.map((u) => {
                  const isVerified = ["COMPLETED", "VERIFIED"].includes((u.kyc_status ?? "").toUpperCase());
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/60 group">
                      {/* Retailer */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          {isVerified ? (
                            <span
                              className="mt-0.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 shrink-0"
                              title="eKYC Verified"
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </span>
                          ) : (
                            <span
                              className="mt-0.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/25 shrink-0"
                              title="eKYC Unverified"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </span>
                          )}
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

                      {/* Hub */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-navy-900">
                            {u.hub_name ?? "Unassigned Hub"}
                          </span>
                        </div>
                      </td>

                      {/* Created By */}
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

                      {/* Created On */}
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.created_at ? when(u.created_at) : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusPill value={u.status} />
                      </td>

                      {/* Action */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <FormModal
        open={open}
        title="Create retailer profile"
        description="This only creates the profile. An activation payment must be submitted and verified before the outlet can sign in to the desk."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create profile"
        submitDisabled={!retailerDraftReady(draft)}
      >
        <RetailerOnboardFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
