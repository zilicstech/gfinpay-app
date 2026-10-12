"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Building2, 
  Copy, 
  ExternalLink, 
  Plus, 
  Search 
} from "lucide-react";
import { api, openDetails } from "@/lib/api-client";
import { maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Field, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, useFlash } from "@/features/admin/AdminChrome";

type Vendor = {
  id: string;
  code: string;
  full_name: string;
  mobile: string;
  email?: string;
  hub_name?: string;
  status: string;
  created_at?: string;
};

type Hub = { id: string; name: string; code: string; city?: string };

export default function VendorsPage() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [hubId, setHubId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [v, h] = await Promise.all([
        api<Vendor[]>("/api/v1/admin/vendors", { token }),
        api<Hub[]>("/api/v1/admin/hubs", { token }),
      ]);
      setVendors(Array.isArray(v) ? v : []);
      setHubs(Array.isArray(h) ? h : []);
      if (!hubId && h[0]) setHubId(h[0].id);
    } catch (e) {
      flash.fail(e, "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<Vendor>("/api/v1/admin/vendors", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({ fullName: fullName.trim(), mobile, email: email.trim() || undefined, hubId }),
      });
      openDetails(`/admin/vendors/${created.id}`, (href) => router.push(href));
    } catch (err) {
      flash.fail(err, "Could not create vendor");
    }
  }

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (statusTab === "ACTIVE" && v.status !== "ACTIVE") return false;
      if (statusTab === "SUSPENDED" && v.status !== "SUSPENDED") return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          v.full_name.toLowerCase().includes(q) ||
          v.code.toLowerCase().includes(q) ||
          v.mobile.includes(q) ||
          (v.hub_name && v.hub_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [vendors, statusTab, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Affiliate Marketing
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Vendors
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            External marketing partners minting employee affiliate URLs to distribute credit cards and banking services.
          </p>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
          disabled={hubs.length === 0}
        >
          <Plus className="h-4 w-4" />
          New Vendor
        </button>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Vendors"],
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
                  {isActive && ` (${filteredVendors.length})`}
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
        ) : filteredVendors.length === 0 ? (
          <EmptyState
            title="No vendors found"
            body={query || statusTab !== "ALL" ? "Try clearing search filters." : "Create the first vendor agency to distribute employee affiliate links for credit products."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Hub</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-slate-50/60 group">
                    {/* 1. Vendor */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 shrink-0"
                          title="Vendor Agency"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{v.full_name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {v.code ?? "—"}
                            </span>
                            {v.code && (
                              <button
                                type="button"
                                onClick={() => copy(v.code)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Code"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                            {copiedCode === v.code && (
                              <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Hub */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-navy-900">
                          {v.hub_name ?? "Unassigned Hub"}
                        </span>
                      </div>
                    </td>

                    {/* 3. Contact */}
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-mono font-medium text-navy-900">
                          {maskMobile(v.mobile)}
                        </p>
                        {v.email && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[12rem]">
                            {v.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Created On */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {v.created_at ? when(v.created_at) : "—"}
                    </td>

                    {/* 5. Status */}
                    <td className="px-6 py-4">
                      <StatusPill value={v.status} />
                    </td>

                    {/* 6. Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/v/${v.code}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-navy-950 bg-slate-100 px-2.5 py-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                          title="Open Public Console"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Manage
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Vendor Modal */}
      <FormModal
        open={open}
        title="New Vendor Agency"
        description="Vendors receive a public portal to create employee affiliate tracking links for catalog products."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Create Vendor"
        submitDisabled={!fullName.trim() || mobile.length !== 10 || !hubId}
      >
        <Field label="Agency / Company Name">
          <input
            className="field"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Apex Marketing Solutions"
          />
        </Field>
        <Field label="Primary Mobile">
          <input
            className="field"
            required
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile"
          />
        </Field>
        <Field label="Contact Email (Optional)">
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="ops@agency.com"
          />
        </Field>
        <SelectField
          label="Hub Assignment"
          required
          value={hubId}
          onChange={setHubId}
          options={hubs.map((h) => ({ value: h.id, label: `${h.name}${h.city ? ` · ${h.city}` : ""}` }))}
        />
      </FormModal>
    </div>
  );
}
