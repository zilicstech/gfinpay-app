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
    <div className="space-y-5">
      <Link href="/distributor/agents" className="text-sm font-semibold text-navy-700 underline">
        All retailers
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <section className="rounded-3xl border border-black/10 bg-white">
        <div className="relative rounded-t-3xl bg-black px-5 py-6 text-white sm:px-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-lg font-semibold text-black">
              {initials(user.full_name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl tracking-tight">{user.full_name}</h1>
                <StatusPill value={user.status} />
                <span className="[&_span]:ring-white/20">
                  <EkycBadge status={agentKycStatus(user) === "VERIFIED" ? "VERIFIED" : "NOT_STARTED"} />
                </span>
              </div>
              <p className="mt-1 font-mono text-sm tracking-widest text-emerald-300/90">{user.code ?? "—"}</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-sm tracking-widest text-white/80">
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label={copied ? "Mobile copied" : "Copy mobile"}
                  onClick={copyMobile}
                >
                  <Copy className={`h-3.5 w-3.5 ${copied ? "text-emerald-300" : ""}`} />
                </button>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                <Store className="h-3.5 w-3.5" />
                {shopLine}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                <Building2 className="h-3.5 w-3.5" />
                {user.parent_name ?? "Your network"}
                {user.hub_name ? ` · ${user.hub_name}` : ""}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Onboarded {when(user.created_at)} · by {createdByLabel(user.created_by_name, user.created_by_code)}
              </p>
            </div>
          </div>
          {!ekycVerified && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className={primaryActionClass} onClick={() => setEkycOpen(true)}>
                <BadgeCheck className="h-4 w-4" /> Do eKYC
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-black/10 rounded-b-3xl">
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Available till</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(user.wallet?.availableBalance)}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">On hold</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(user.wallet?.holdBalance)}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Commission earned</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(user.commissionEarned)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2">
          {(["sales", "customers", "transactions"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-black text-emerald-300" : "bg-[#f5f5f5] text-navy-700"}`}
              onClick={() => setTab(key)}
            >
              {key === "sales" ? "Sales" : key === "customers" ? "Customers" : "Transactions"}
            </button>
          ))}
        </div>
        {tab === "sales" ? (
          salesError ? (
            <Alert tone="error">{salesError}</Alert>
          ) : salesLoading ? (
            <div className="card h-32 animate-pulse bg-[#f5f5f5]" />
          ) : (
            <SalesTable rows={sales} detailBase="/distributor/sales" hideRetailer />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-[#f5f5f5]" />
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
