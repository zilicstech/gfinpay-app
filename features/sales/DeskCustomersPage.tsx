"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Users 
} from "lucide-react";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { FormModal } from "@/features/admin/AdminChrome";
import { CustomerFields, emptyCustomerDraft, type CustomerDraft } from "@/features/sales/customer-form";

type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  pincode?: string;
  ekyc_status?: string;
  created_by?: string;
  created_by_code?: string;
  retailer_name?: string;
};

export function DeskCustomersPage({ basePath }: { basePath: "/agent/customers" | "/distributor/customers" }) {
  const isDistributor = basePath === "/distributor/customers";
  const token = useSession((s) => s.token);
  const router = useRouter();

  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyCustomerDraft());
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(() => {
      const digits = query.replace(/\D/g, "");
      const path = digits ? `/api/v1/customers?mobile=${digits}` : "/api/v1/customers";
      api<Customer[]>(path, { token })
        .then((next) => {
          setRows(Array.isArray(next) ? next : []);
          setError(null);
        })
        .catch((e) => setError(formatApiError(e, "Could not load customers")))
        .finally(() => setLoaded(true));
    }, 200);
    return () => clearTimeout(handle);
  }, [token, query]);

  function copy(phone: string) {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1800);
  }

  function closeModal() {
    setOpen(false);
    setDraft(emptyCustomerDraft());
    setFormError(null);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const created = await api<Customer>("/api/v1/customers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          email: draft.email || null,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`${basePath}/${created.id}`, (href) => router.push(href));
    } catch (err) {
      setFormError(formatApiError(err, "Could not save the customer"));
    } finally {
      setBusy(false);
    }
  }

  const metrics = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((c) => c.ekyc_status === "VERIFIED").length;
    const pending = rows.filter((c) => c.ekyc_status !== "VERIFIED").length;
    return { total, verified, pending };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((c) => {
      if (statusTab === "VERIFIED" && c.ekyc_status !== "VERIFIED") return false;
      if (statusTab === "PENDING" && c.ekyc_status === "VERIFIED") return false;
      return true;
    });
  }, [rows, statusTab]);

  const ready = draft.mobile.length === 10 && draft.fullName.trim() && draft.city.trim() && draft.state && draft.pincode.length === 6;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Customer Book
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            {isDistributor ? "Network Customers" : "Outlet Customers"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isDistributor
              ? "All consumers registered across your network outlets for money transfers and card applications."
              : "Registered customers at your store counter. Open a profile to start transfers or check history."}
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Registered"
          value={String(metrics.total)}
          hint="Counter customer book"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="eKYC Verified"
          value={String(metrics.verified)}
          hint="Compliant with KYC norms"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Verification"
          value={String(metrics.pending)}
          hint="Submit documents"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Control Bar & Table */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Customers"],
              ["VERIFIED", "eKYC Verified"],
              ["PENDING", "Pending KYC"],
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
              placeholder="Search by 10-digit mobile number..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>

        {/* Master Table */}
        {!loaded ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No customers found"
            body={query ? "No customer found with this phone number." : "Add a customer to initiate transfers or card applications."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">Location</th>
                  {isDistributor && <th className="px-6 py-4">Outlet Counter</th>}
                  <th className="px-6 py-4">eKYC</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm shrink-0">
                          {c.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-950 text-sm">{c.full_name}</p>
                          <span className="text-[11px] text-slate-400">Customer Profile</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>+91 {c.mobile}</span>
                        <button
                          type="button"
                          onClick={() => copy(c.mobile)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copy Mobile"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copiedPhone === c.mobile && (
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{[c.city, c.state].filter(Boolean).join(", ") || "—"}</span>
                      </div>
                    </td>
                    {isDistributor && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-navy-900">
                          <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{c.retailer_name ?? "Direct Hub"}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <EkycBadge status={c.ekyc_status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${basePath}/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        Profile
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
        title="Add Customer"
        description="Register a new customer at your outlet counter with full name, mobile, and address."
        onClose={closeModal}
        onSubmit={create}
        submitLabel={busy ? "Saving…" : "Save Customer"}
        submitDisabled={busy || !ready}
      >
        {formError && <Alert tone="error">{formError}</Alert>}
        <CustomerFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
