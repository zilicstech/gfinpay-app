"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BadgeCheck,
  RefreshCw,
  Building2,
  Clock,
  Copy,
  Lock,
  MapPin,
  Phone,
  Unlock,
  User,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { BankEkycSummary } from "@/features/ekyc/BankEkycSummary";
import { AgentEkycModal, AgentEkycStatusModal, agentEkycLinkOpened, agentEkycVerified, agentKycStatus } from "@/features/admin/AgentEkycModal";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { retailerLocationFromKyc, retailerLocationLine } from "@/features/admin/retailer-location";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import { ActivationRequestModal } from "@/features/finance/ActivationRequestModal";
import { RetailerRequestsPanel } from "@/features/finance/RetailerRequestsPanel";
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

type RetailerModal = "freeze" | "inactivate" | "activate" | "activation" | null;

export function DistributorRetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<RetailerModal>(null);
  const [tab, setTab] = useState<"sales" | "customers" | "transactions" | "requests">("sales");
  const [requestCount, setRequestCount] = useState(0);
  const [requestTick, setRequestTick] = useState(0);
  const [sales, setSales] = useState<SalesLead[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const outletBase = `/api/v1/desk/outlets/${id}`;

  async function load() {
    const data = await api<UserDetail>(outletBase, { token });
    setUser(data);
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

  async function patchStatus(status: string) {
    try {
      await api(`/api/v1/desk/outlets/${id}/status`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
      setModal(null);
      flash.ok(`Retailer is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function markActive() {
    try {
      await api(`/api/v1/finance/retailers/${id}/activate`, { token, method: "POST", body: "{}" });
      setModal(null);
      await load();
      flash.ok("Retailer is now active.");
    } catch (e) {
      flash.fail(e, "Could not activate retailer");
    }
  }

  async function freeze(frozen: boolean) {
    try {
      await api(`/api/v1/desk/outlets/${id}/wallet/freeze`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ frozen }),
      });
      setModal(null);
      await load();
      flash.ok(frozen ? "Till frozen." : "Till unfrozen.");
    } catch (e) {
      flash.fail(e, "Could not change wallet");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function copyCode() {
    if (!user?.code) return;
    await navigator.clipboard.writeText(user.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const location = retailerLocationFromKyc(user.kyc) ?? {
    city: user.retailer_city,
    state: user.retailer_state,
    pincode: user.retailer_pincode,
  };
  const shopLine = retailerLocationLine(location);
  const isFrozen = user.wallet?.status === "FROZEN";

  const canRequestActivation = user.status === "PENDING" || user.status === "REJECTED";
  const canManage = user.status === "APPROVED" || user.status === "ACTIVE";
  const ekycVerified = agentEkycVerified(user);
  const ekycLinkOpened = agentEkycLinkOpened(user);
  const manageActions: ManageAction[] = [
    ...(!ekycVerified
      ? [
          {
            label: ekycLinkOpened ? "Check status" : "Do eKYC",
            icon: ekycLinkOpened ? <RefreshCw className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />,
            onClick: () => (ekycLinkOpened ? setStatusOpen(true) : setEkycOpen(true)),
          },
        ]
      : []),
    ...(canRequestActivation
      ? [
          {
            label: "Request activation",
            icon: <BadgeCheck className="h-4 w-4" />,
            onClick: () => setModal("activation"),
          },
        ]
      : []),
    ...(canManage
      ? [
          {
            label: isFrozen ? "Unfreeze wallet" : "Freeze wallet",
            icon: isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
            onClick: () => setModal("freeze"),
          },
          ...(user.status === "APPROVED"
            ? [
                {
                  label: "Mark active",
                  icon: <UserCheck className="h-4 w-4" />,
                  onClick: () => setModal("activate"),
                },
              ]
            : [
                {
                  label: "Mark inactive",
                  icon: <UserX className="h-4 w-4" />,
                  onClick: () => setModal("inactivate"),
                  tone: "danger" as const,
                },
              ]),
        ]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/distributor/agents"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Retailers
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Simplified Profile Card with Manage Button on the Top Right */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Retailer Outlet
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
              <EkycBadge status={agentEkycVerified(user) ? "COMPLETED" : "PENDING"} />
              <BankEkycSummary kyc={user.kyc} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* 1st Row: Location of the retailer only */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">{shopLine || "Location not specified"}</span>
            </div>

            {/* 2nd Row: Distributor & Hub */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Distributor:{" "}
                  <span className="font-medium text-slate-200">
                    {user.parent_name || "Your Network Downline"}
                  </span>
                </span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-200">
                  {[user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ") || "Unassigned Hub"}
                </span>
              </div>
            </div>

            {/* 3rd Row: GFINCODE & PHONE with copy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{user.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy GFIN Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>
            </div>

            {/* 4th Row: Creation details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{when(user.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-white">
                    {user.created_by_name || user.created_by || "Platform Admin"}
                  </span>
                  {user.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({user.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {manageActions.length > 0 && (
              <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
            )}
          </div>
        </div>
      </section>

      {/* Tabs & Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {(["sales", "customers", "transactions", "requests"] as const).map((key) => {
            const isActive = tab === key;
            const count =
              key === "sales"
                ? sales.length
                : key === "customers"
                ? customers.length
                : key === "requests"
                ? requestCount
                : user.recentTransactions?.length ?? 0;
            const label =
              key === "sales"
                ? "Sales"
                : key === "customers"
                ? "Customers"
                : key === "requests"
                ? "Requests"
                : "Transactions";
            return (
              <button
                key={key}
                type="button"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-navy-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-navy-950"
                }`}
                onClick={() => setTab(key)}
              >
                {label}
                {isActive && ` (${count})`}
              </button>
            );
          })}
        </div>

        {tab === "sales" ? (
          salesError ? (
            <Alert tone="error">{salesError}</Alert>
          ) : salesLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : sales.length === 0 ? (
            <EmptyState title="No sales leads yet" body="Leads generated by this retailer will appear here." />
          ) : (
            <SalesTable rows={sales} detailBase="/distributor/sales" hideRetailer showChannel={false} />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear here when this retailer adds them at the desk." />
          ) : (
            <DataTable
              columns={["Customer", "Mobile", "Location", "Created By", "Code", "eKYC", "Created On"]}
              rows={customers.map((c) => [
                <span key={`${c.id}-name`} className="font-semibold text-navy-950">{c.full_name}</span>,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.created_by ?? "—",
                c.created_by_code ? (
                  <span key={`${c.id}-code`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {c.created_by_code}
                  </span>
                ) : (
                  "—"
                ),
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : tab === "requests" && id ? (
          <RetailerRequestsPanel
            token={token}
            retailerId={id}
            refreshKey={requestTick}
            onCount={setRequestCount}
          />
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Outlet desk activity appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "Status", "Amount", "Action"]}
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
        <>
          <AgentEkycModal
            open={ekycOpen}
            userId={id}
            userName={user.full_name}
            userType={user.user_type}
            email={user.email}
            token={token}
            scope="desk"
            onClose={() => setEkycOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
          <AgentEkycStatusModal
            open={statusOpen}
            userId={id}
            userName={user.full_name}
            token={token}
            scope="desk"
            onClose={() => setStatusOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
        </>
      )}

      <FormModal open={modal === "freeze"} title={user.wallet?.status === "FROZEN" ? "Unfreeze wallet" : "Freeze wallet"} onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); freeze(user.wallet?.status !== "FROZEN"); }} submitLabel={user.wallet?.status === "FROZEN" ? "Unfreeze" : "Freeze"}>
        <p className="text-sm text-navy-600">Confirm wallet control for {user.full_name}.</p>
      </FormModal>
      <FormModal open={modal === "activate"} title="Mark active" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); markActive(); }} submitLabel="Mark active">
        <p className="text-sm text-navy-600">The auditor has approved this retailer. Marking them active lets them use the outlet desk.</p>
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Mark inactive" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("INACTIVE"); }} submitLabel="Mark inactive">
        <p className="text-sm text-navy-600">{user.full_name} will not be able to sign in.</p>
      </FormModal>
      {id && (
        <ActivationRequestModal
          open={modal === "activation"}
          token={token}
          retailerId={id}
          onClose={() => setModal(null)}
          onSubmitted={() => {
            setModal(null);
            setTab("requests");
            setRequestTick((n) => n + 1);
            load().then(() => flash.ok("Activation request submitted.")).catch(() => undefined);
          }}
          onError={(err) => flash.fail(err, "Could not submit the activation request")}
        />
      )}
    </div>
  );
}
