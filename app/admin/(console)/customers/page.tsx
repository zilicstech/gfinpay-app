"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Copy,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState } from "@/components/ui/primitives";

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

export default function AdminCustomersPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "RETAILER" | "VENDOR">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(() => {
      const digits = query.replace(/\D/g, "");
      const path = digits && digits.length >= 4 ? `/api/v1/customers?mobile=${digits}` : "/api/v1/customers";
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

  const counts = useMemo(() => {
    const retailer = rows.filter((c) => c.created_by === "RETAILER").length;
    const vendor = rows.filter((c) => c.created_by === "VENDOR").length;
    return { retailer, vendor };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((c) => {
      if (statusTab === "RETAILER" && c.created_by !== "RETAILER") return false;
      if (statusTab === "VENDOR" && c.created_by !== "VENDOR") return false;

      if (query) {
        const q = query.toLowerCase();
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          (c.pincode && c.pincode.includes(q)) ||
          (c.retailer_name && c.retailer_name.toLowerCase().includes(q)) ||
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
          (c.created_by_code && c.created_by_code.toLowerCase().includes(q)) ||
          (c.created_by_name && c.created_by_name.toLowerCase().includes(q))
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
            Customer Directory
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Platform Customers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Unified directory of all consumers served across retail outlets, distributors, and affiliate vendor teams.
          </p>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Filter and Control Bar */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All Customers", rows.length],
              ["RETAILER", "Retail Outlets", counts.retailer],
              ["VENDOR", "Vendor Field", counts.vendor],
            ] as const).map(([key, label, count]) => {
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
                  {` (${count})`}
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
              placeholder="Search by Name, Phone, Location, Creator..."
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
            title="No customers found"
            body={
              query || statusTab !== "ALL"
                ? "Try clearing your search filters."
                : "Customers will appear here as they complete transactions or apply for banking products."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((c) => {
                  const isVerified = (c.ekyc_status ?? "").toUpperCase() === "VERIFIED";
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60 group">
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
                            <p className="font-semibold text-navy-950 text-sm">{c.full_name}</p>
                            <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>+91 {c.mobile}</span>
                              <button
                                type="button"
                                onClick={() => copy(c.mobile)}
                                className="text-slate-400 hover:text-slate-700 ml-0.5"
                                title="Copy Mobile"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              {copiedPhone === c.mobile && (
                                <span className="text-[10px] text-emerald-600 font-bold ml-0.5">Copied!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{locationLine(c)}</span>
                        </div>
                        {c.pincode && (
                          <span className="font-mono text-[10px] text-slate-400 mt-0.5 block pl-5">{c.pincode}</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">
                            {c.retailer_name || c.vendor_name || c.created_by_name || (c.created_by === "ADMIN" ? "Platform Admin" : c.created_by || "Platform Admin")}
                          </p>
                          {c.created_by_code && (
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{c.created_by_code}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {c.created_at ? when(c.created_at) : "—"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/customers/${c.id}`}
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
    </div>
  );
}
