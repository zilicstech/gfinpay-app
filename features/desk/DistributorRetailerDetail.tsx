"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, Building2, Copy, Store } from "lucide-react";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { AgentEkycModal, agentEkycVerified, agentKycStatus } from "@/features/admin/AgentEkycModal";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when, createdByLabel } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { retailerLocationFromKyc, retailerLocationLine } from "@/features/admin/retailer-location";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import type { UserDetail } from "@/features/admin/types";

type RetailerCustomer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  ekyc_status?: string;
  created_at?: string;
  created_by?: string;
  created_by_code?: string;
};

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-200";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function DistributorRetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"sales" | "customers" | "transactions">("sales");
  const [sales, setSales] = useState<SalesLead[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);

  const outletBase = `/api/v1/desk/outlets/${id}`;

  async function load() {
    setUser(await api<UserDetail>(outletBase, { token }));
  }

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load retailer")));
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || tab !== "sales") return;
    setSalesLoading(true);
    setSalesError(null);
    api<SalesLead[]>(`/api/v1/sales?retailerId=${id}`, { token })
      .then(setSales)
      .catch((e) => setSalesError(formatApiError(e, "Could not load sales")))
      .finally(() => setSalesLoading(false));
  }, [token, id, tab]);

  useEffect(() => {
    if (!token || !id || tab !== "customers") return;
    setCustomersLoading(true);
    setCustomersError(null);
    api<RetailerCustomer[]>(`/api/v1/customers?retailerId=${id}`, { token })
      .then(setCustomers)
      .catch((e) => setCustomersError(formatApiError(e, "Could not load customers")))
      .finally(() => setCustomersLoading(false));
  }, [token, id, tab]);

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const location = retailerLocationFromKyc(user.kyc) ?? {
    city: user.retailer_city,
    state: user.retailer_state,
    pincode: user.retailer_pincode,
  };
  const shopLine = retailerLocationLine(location);
  const ekycVerified = agentEkycVerified(user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/distributor/agents" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors">
          ← Back to Retailers Directory
        </Link>
        <span className="text-xs text-slate-400 font-mono">Outlet ID: {user.id}</span>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Main Luxury Hero Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-navy-950 shadow-lg shadow-emerald-500/20">
                {initials(user.full_name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{user.full_name}</h1>
                  <StatusPill value={user.status} />
                  <span className="[&_span]:ring-white/20">
                    <EkycBadge status={agentKycStatus(user) === "VERIFIED" ? "VERIFIED" : "NOT_STARTED"} />
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                  <span className="font-mono text-emerald-400 font-bold tracking-widest">{user.code ?? "—"}</span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-1.5 font-mono">
                    {maskMobile(user.mobile)}
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label={copied ? "Mobile copied" : "Copy mobile"}
                      onClick={copyMobile}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copied && <span className="text-[10px] text-emerald-400 font-bold ml-1">Copied!</span>}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Store className="h-3.5 w-3.5 text-emerald-400" />
                    {shopLine}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {user.parent_name ?? "Your network territory"}
                    {user.hub_name ? ` · ${user.hub_name}` : ""}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>Onboarded {when(user.created_at)} by {createdByLabel(user.created_by_name, user.created_by_code)}</span>
                </div>
              </div>
            </div>

            {!ekycVerified && (
              <div className="relative z-10 shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-navy-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors"
                  onClick={() => setEkycOpen(true)}
                >
                  <BadgeCheck className="h-4 w-4" /> Complete Outlet eKYC
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Float Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Till Float</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{inr(user.wallet?.availableBalance)}</p>
            <p className="mt-0.5 text-xs text-emerald-600">Current active counter liquidity</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">On Hold</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-700">{inr(user.wallet?.holdBalance)}</p>
            <p className="mt-0.5 text-xs text-slate-400">In-flight transactions</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Commissions Generated</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{inr(user.commissionEarned)}</p>
            <p className="mt-0.5 text-xs text-slate-400">Retailer earned revenue</p>
          </div>
        </div>
      </section>

      {/* Tabs & Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
          {(["sales", "customers", "transactions"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === key
                  ? "bg-navy-950 text-white shadow-sm"
                  : "text-slate-600 hover:text-navy-950 hover:bg-slate-200/60"
              }`}
              onClick={() => setTab(key)}
            >
              {key === "sales" ? "Sales Pipeline" : key === "customers" ? "Customer Directory" : "Counter Transactions"}
            </button>
          ))}
        </div>
        {tab === "sales" ? (
          salesError ? (
            <Alert tone="error">{salesError}</Alert>
          ) : salesLoading ? (
            <div className="card h-32 animate-pulse bg-slate-50" />
          ) : (
            <SalesTable rows={sales} detailBase="/distributor/sales" hideRetailer />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-slate-50" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear here when this retailer adds them at the desk." />
          ) : (
            <DataTable
              columns={["Name", "Mobile", "City", "Created by", "Code", "eKYC", "Added"]}
              rows={customers.map((c) => [
                c.full_name,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.created_by ?? "—",
                c.created_by_code ?? "—",
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Outlet desk activity appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "State", "Amount", ""]}
            rows={user.recentTransactions.map((t) => [
              when(t.created_at),
              t.txn_type.replaceAll("_", " "),
              <StatusPill key={t.id} value={t.state} />,
              inr(t.amount),
              <ViewLink key={`${t.id}-v`} href={`/distributor/transactions/${t.id}`} />,
            ])}
          />
        )}
      </section>

      {id && (
        <AgentEkycModal
          open={ekycOpen}
          userId={id}
          userName={user.full_name}
          mobile={user.mobile}
          token={token}
          onClose={() => setEkycOpen(false)}
          onVerified={() => load().catch(() => undefined)}
        />
      )}
    </div>
  );
}
