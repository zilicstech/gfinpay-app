"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Copy, 
  MapPin, 
  Phone, 
  Search, 
  Shield, 
  ShieldCheck, 
  Store, 
  UserCheck, 
  Users 
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";

type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  pincode?: string;
  retailer_name?: string;
  vendor_name?: string;
  ekyc_status?: string;
  created_by?: string;
  created_by_code?: string;
  created_by_name?: string;
  created_at?: string;
};

function locationLine(c: Customer) {
  return [c.city, c.state].filter(Boolean).join(", ") || "—";
}

const CREATED_BY_MARK: Record<string, { label: string; Icon: typeof Store; chip: string }> = {
  ADMIN: {
    label: "Admin Direct",
    Icon: Shield,
    chip: "bg-slate-900 text-amber-300 ring-slate-800",
  },
  DISTRIBUTOR: {
    label: "Distributor",
    Icon: Users,
    chip: "bg-emerald-950 text-emerald-300 ring-emerald-800/40",
  },
  RETAILER: {
    label: "Retail Counter",
    Icon: Store,
    chip: "bg-indigo-950 text-indigo-300 ring-indigo-800/40",
  },
  VENDOR: {
    label: "Vendor Agency",
    Icon: Briefcase,
    chip: "bg-amber-950 text-amber-200 ring-amber-800/40",
  },
};

export default function AdminCustomersPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
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

  const metrics = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((c) => c.ekyc_status === "VERIFIED").length;
    const retailSourced = rows.filter((c) => c.created_by === "RETAILER").length;
    const vendorSourced = rows.filter((c) => c.created_by === "VENDOR").length;
    return { total, verified, retailSourced, vendorSourced };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((c) => {
      if (channelFilter !== "ALL" && c.created_by !== channelFilter) return false;
      return true;
    });
  }, [rows, channelFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Customer Registry
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Platform Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Unified directory of all consumers served across retail outlets, distributors, and affiliate vendor teams.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Consumers"
          value={String(metrics.total)}
          hint="Across all channels"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="eKYC Verified"
          value={String(metrics.verified)}
          hint="Compliant profiles"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Retail Counter Sourced"
          value={String(metrics.retailSourced)}
          hint="In-store assisted banking"
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Vendor Field Sourced"
          value={String(metrics.vendorSourced)}
          hint="Direct affiliate programs"
          icon={<Briefcase className="h-5 w-5" />}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Filters and Search Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Channels"],
              ["RETAILER", "Retailer Outlets"],
              ["VENDOR", "Vendor Field"],
              ["DISTRIBUTOR", "Distributors"],
              ["ADMIN", "Admin Direct"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setChannelFilter(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  channelFilter === key
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No customers match your criteria"
            body={query ? "No customer found with this phone number." : "Customers will show here as they complete transactions or apply for products."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Sourced By</th>
                  <th className="px-6 py-4">Channel Partner</th>
                  <th className="px-6 py-4">eKYC</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((c) => {
                  const mark = c.created_by ? CREATED_BY_MARK[c.created_by] : undefined;
                  const Icon = mark?.Icon;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm shrink-0">
                            {c.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">{c.full_name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-slate-500">
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{locationLine(c)}</span>
                        </div>
                        {c.pincode && (
                          <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">{c.pincode}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {mark && Icon ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${mark.chip}`}>
                            <Icon className="h-3 w-3" />
                            {mark.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-navy-950 text-xs sm:text-sm">
                          {c.created_by === "VENDOR" ? (c.vendor_name ?? "Vendor Partner") : (c.retailer_name ?? "Counter Outlet")}
                        </p>
                        {c.created_by_code && (
                          <span className="font-mono text-[10px] text-slate-400">{c.created_by_code}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <EkycBadge status={c.ekyc_status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {c.created_at ? when(c.created_at) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Profile
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
    </div>
  );
}
