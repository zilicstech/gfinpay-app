"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  Search, 
  TrendingUp 
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, PageHeader, StatCard } from "@/components/ui/primitives";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import { RequireCustomerDesk } from "@/features/desk/DeskServices";

export default function AgentSalesPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<SalesLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api<SalesLead[]>("/api/v1/sales", { token })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setError(formatApiError(e, "Could not load sales")))
      .finally(() => setLoading(false));
  }, [token]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const opened = rows.filter((r) => r.link_opened_at).length;
    const converted = rows.filter((r) => r.state === "CONVERTED" || r.state === "ACTIVATED").length;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, opened, converted, rate };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.state !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          (r.product_code && r.product_code.toLowerCase().includes(q)) ||
          (r.item_name && r.item_name.toLowerCase().includes(q)) ||
          (r.customer_name && r.customer_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rows, statusFilter, query]);

  return (
    <RequireCustomerDesk fallbackHref="/agent/dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              Outlet Counter
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              Product Leads & Dispatches
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Every digital application link generated from your counter for credit cards, loans, and fastag.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Dispatched"
            value={String(metrics.total)}
            hint="Customer links generated"
            icon={<Layers className="h-5 w-5" />}
          />
          <StatCard
            label="Customer Opened"
            value={String(metrics.opened)}
            hint="Viewed on customer phone"
            icon={<ArrowUpRight className="h-5 w-5" />}
          />
          <StatCard
            label="Successful Issuance"
            value={String(metrics.converted)}
            hint="Commission paid to wallet"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            label="Lead Conversion"
            value={`${metrics.rate}%`}
            hint="Counter conversion rate"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {/* Control Bar & Table */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(["ALL", "CONVERTED", "ACTIVATED", "OPENED", "INITIATED"] as const).map((s) => (
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
                  {s === "ALL" ? "All Leads" : s}
                </button>
              ))}
            </div>

            <div className="relative min-w-[18rem]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Product, Customer Name..."
                className="field !pl-10 !py-2 text-xs w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <SalesTable rows={filteredRows} detailBase="/agent/sales" hideRetailer />
          )}
        </div>
      </div>
    </RequireCustomerDesk>
  );
}
