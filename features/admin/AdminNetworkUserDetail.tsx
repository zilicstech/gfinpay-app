"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BadgeCheck,
  RefreshCw,
  Building2,
  Clock,
  Copy,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  Plus,
  Send,
  Store,
  Unlock,
  User,
  UserPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { AgentEkycModal, AgentEkycStatusModal, agentEkycLinkOpened, agentEkycVerified, agentKycStatus } from "@/features/admin/AgentEkycModal";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { inr, maskMobile, when, createdByLabel } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import { retailerLocationFromKyc, retailerLocationLine } from "@/features/admin/retailer-location";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
import { ActivationRequestModal } from "@/features/finance/ActivationRequestModal";
import { RetailerRequestsPanel } from "@/features/finance/RetailerRequestsPanel";
import type { Hub, UserDetail, UserRow } from "@/features/admin/types";

type RetailerCustomer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  ekyc_status?: string;
  created_at?: string;
  retailer_name?: string;
  created_by?: string;
  created_by_code?: string;
};

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-200";

type DistributorModal = "hub" | "password" | "adjust" | "freeze" | "inactivate" | "retailer" | null;

type RetailerModal = "transfer" | "password" | "adjust" | "freeze" | "inactivate" | "activation" | null;

export function AdminDistributorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubId, setHubId] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("CREDIT");
  const [narration, setNarration] = useState("");
  const [retailerDraft, setRetailerDraft] = useState<RetailerDraft>(emptyRetailerDraft);
  const [modal, setModal] = useState<DistributorModal>(null);
  const [tab, setTab] = useState<"retailers" | "customers" | "transactions">("retailers");
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);

  async function load() {
    const [u, h] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<Hub[]>("/api/v1/admin/hubs", { token }),
    ]);
    setUser(u);
    setHubs(h);
    setHubId(u.hub_id ?? "");
  }

  useEffect(() => {
    if (token && id) {
      load().catch((e) => setLoadError(formatApiError(e, "Failed to load distributor")));
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || tab !== "customers") return;
    setCustomersLoading(true);
    setCustomersError(null);
    api<RetailerCustomer[]>(`/api/v1/customers?distributorId=${id}`, { token })
      .then(setCustomers)
      .catch((e) => setCustomersError(formatApiError(e, "Could not load customers")))
      .finally(() => setCustomersLoading(false));
  }, [token, id, tab]);

  async function patchStatus(status: string) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Distributor is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function saveHub(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/hub`, { token, method: "PATCH", body: JSON.stringify({ hubId }) }));
      setModal(null);
      flash.ok("Hub assignment updated. Downline outlets moved with them.");
    } catch (e) {
      flash.fail(e, "Could not move hub");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, { token, method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setModal(null);
      flash.ok("Password reset. Share it out of band.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function adjust(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/adjust`, {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), direction, narration }),
      }));
      setAmount("");
      setNarration("");
      setModal(null);
      flash.ok("Wallet adjustment posted to the ledger.");
    } catch (e) {
      flash.fail(e, "Adjustment failed");
    }
  }

  async function createRetailer(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await api<{ id: string }>("/api/v1/admin/users/retailers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: retailerDraft.fullName.trim(),
          mobile: retailerDraft.mobile,
          email: retailerDraft.email.trim(),
          password: retailerDraft.password,
          distributorId: id,
          city: retailerDraft.city.trim(),
          state: retailerDraft.state,
          pincode: retailerDraft.pincode,
        }),
      });
      openDetails(`/admin/retailers/${created.id}`, (href) => router.push(href));
    } catch (e) {
      flash.fail(e, "Could not create retailer");
    }
  }

  async function freeze(frozen: boolean) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/freeze`, { token, method: "PATCH", body: JSON.stringify({ frozen }) }));
      setModal(null);
      flash.ok(frozen ? "Wallet frozen." : "Wallet unfrozen.");
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

  const hubLine = [user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ");
  const ekycVerified = agentEkycVerified(user);
  const isFrozen = user.wallet?.status === "FROZEN";
  const manageActions: ManageAction[] = [
    {
      label: "New Retailer",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => setModal("retailer"),
    },
    ...(!ekycVerified
      ? [
          {
            label: "Complete eKYC",
            icon: <BadgeCheck className="h-4 w-4" />,
            onClick: () => setEkycOpen(true),
          },
        ]
      : []),
    {
      label: "Change hub",
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => setModal("hub"),
    },
    {
      label: "Adjust wallet",
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => setModal("adjust"),
    },
    {
      label: isFrozen ? "Unfreeze wallet" : "Freeze wallet",
      icon: isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      onClick: () => setModal("freeze"),
    },
    ...(user.status === "ACTIVE"
      ? [
          {
            label: "Inactivate",
            icon: <UserX className="h-4 w-4" />,
            onClick: () => setModal("inactivate"),
            tone: "danger" as const,
          },
        ]
      : []),
    {
      label: "Reset password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/distributors"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Distributors
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
                Master Distributor
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
              <EkycBadge status={agentKycStatus(user) === "VERIFIED" ? "VERIFIED" : "NOT_STARTED"} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* Hub Territory Row */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">{hubLine || "Unassigned Hub"}</span>
            </div>

            {/* Row 1: GFINCODE & PHONE with copy */}
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

            {/* Row 2: Time and User who created it */}
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
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>



      {/* Tabs & Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          {(["retailers", "customers", "transactions"] as const).map((key) => {
            const isActive = tab === key;
            const count =
              key === "retailers"
                ? user.retailers?.length ?? 0
                : key === "customers"
                ? customers.length
                : user.recentTransactions?.length ?? 0;
            const label =
              key === "retailers"
                ? "Retailers"
                : key === "customers"
                ? "Customers"
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

        {tab === "retailers" ? (
          !user.retailers?.length ? (
            <EmptyState title="No retailers yet" body="Add a retailer to place under this distributor." />
          ) : (
            <DataTable
              columns={["Retailer", "Code", "Location", "Mobile", "eKYC", "Status", "Action"]}
              rows={user.retailers.map((r) => [
                <span key={`${r.id}-name`} className="font-semibold text-navy-950">{r.full_name}</span>,
                <span key={`${r.id}-code`} className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {r.code ?? "—"}
                </span>,
                retailerLocationLine({
                  city: r.city ?? r.retailer_city,
                  state: r.state ?? r.retailer_state,
                  pincode: r.pincode ?? r.retailer_pincode,
                }) || "—",
                maskMobile(r.mobile),
                <EkycBadge key={`${r.id}-kyc`} status={r.kyc_status} />,
                <StatusPill key={r.id} value={r.status} />,
                <ViewLink key={`${r.id}-v`} href={`/admin/retailers/${r.id}`} />,
              ])}
            />
          )
        ) : tab === "customers" ? (
          customersError ? (
            <Alert tone="error">{customersError}</Alert>
          ) : customersLoading ? (
            <div className="card h-32 animate-pulse bg-slate-100" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear when this distributor or their retailers add them at the desk." />
          ) : (
            <DataTable
              columns={["Customer", "Mobile", "Location", "Retailer", "Created By", "eKYC", "Created On"]}
              rows={customers.map((c) => [
                <span key={`${c.id}-name`} className="font-semibold text-navy-950">{c.full_name}</span>,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.retailer_name ?? "—",
                c.created_by ?? "—",
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Ledger activity for this distributor appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "Status", "Amount", "Action"]}
            rows={user.recentTransactions.map((t) => [
              when(t.created_at),
              t.txn_type.replaceAll("_", " "),
              <StatusPill key={t.id} value={t.state} />,
              inr(t.amount),
              <ViewLink key={`${t.id}-v`} href={`/admin/transactions/${t.id}`} />,
            ])}
          />
        )}
      </section>

      {id && (
        <AgentEkycModal
          open={ekycOpen}
          userId={id}
          userName={user.full_name}
          userType={user.user_type}
          email={user.email}
          token={token}
          onClose={() => setEkycOpen(false)}
          onVerified={() => { load().catch(() => undefined); }}
        />
      )}

      <DistributorModals
        user={user}
        modal={modal}
        setModal={setModal}
        hubs={hubs}
        hubId={hubId}
        setHubId={setHubId}
        password={password}
        setPassword={setPassword}
        amount={amount}
        setAmount={setAmount}
        direction={direction}
        setDirection={setDirection}
        narration={narration}
        setNarration={setNarration}
        retailerDraft={retailerDraft}
        setRetailerDraft={setRetailerDraft}
        saveHub={saveHub}
        resetPassword={resetPassword}
        adjust={adjust}
        createRetailer={createRetailer}
        freeze={freeze}
        patchStatus={patchStatus}
      />
    </div>
  );
}

function DistributorModals(props: {
  user: UserDetail;
  modal: DistributorModal;
  setModal: (m: DistributorModal) => void;
  hubs: Hub[];
  hubId: string;
  setHubId: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  direction: string;
  setDirection: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  retailerDraft: RetailerDraft;
  setRetailerDraft: (v: RetailerDraft) => void;
  saveHub: (e: FormEvent) => void;
  resetPassword: (e: FormEvent) => void;
  adjust: (e: FormEvent) => void;
  createRetailer: (e: FormEvent) => void;
  freeze: (frozen: boolean) => void;
  patchStatus: (status: string) => void;
}) {
  const { user, modal, setModal } = props;
  return (
    <>
      <FormModal
        open={modal === "retailer"}
        title="Add retailer"
        description={`The outlet will sit under ${user.full_name} and inherit ${user.hub_name ?? "their hub"}.`}
        onClose={() => setModal(null)}
        onSubmit={props.createRetailer}
        submitLabel="Create retailer"
        submitDisabled={!retailerDraftReady(props.retailerDraft)}
      >
        <RetailerOnboardFields value={props.retailerDraft} onChange={props.setRetailerDraft} />
      </FormModal>
      <FormModal open={modal === "hub"} title="Change hub" description="Outlets follow the distributor." onClose={() => setModal(null)} onSubmit={props.saveHub} submitLabel="Save hub">
        <SelectField label="Hub" required value={props.hubId} onChange={props.setHubId} options={props.hubs.map((h) => ({ value: h.id, label: `${h.name} · ${h.city}` }))} />
      </FormModal>
      <FormModal open={modal === "password"} title="Reset password" onClose={() => setModal(null)} onSubmit={props.resetPassword} submitLabel="Reset password">
        <TextField label="New password" required type="password" value={props.password} onChange={props.setPassword} />
      </FormModal>
      <FormModal open={modal === "adjust"} title="Adjust wallet" description="Posts an ADJUSTMENT to the immutable ledger." onClose={() => setModal(null)} onSubmit={props.adjust} submitLabel="Post adjustment">
        <SelectField label="Direction" required value={props.direction} onChange={props.setDirection} options={[{ value: "CREDIT", label: "Credit (add float)" }, { value: "DEBIT", label: "Debit (remove float)" }]} />
        <TextField label="Amount" required inputMode="numeric" value={props.amount} onChange={props.setAmount} />
        <TextField label="Narration" value={props.narration} onChange={props.setNarration} />
      </FormModal>
      <FormModal
        open={modal === "freeze"}
        title={user.wallet?.status === "FROZEN" ? "Unfreeze wallet" : "Freeze wallet"}
        description="Freeze stops new spends. Existing holds stay until they settle."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          props.freeze(user.wallet?.status !== "FROZEN");
        }}
        submitLabel={user.wallet?.status === "FROZEN" ? "Unfreeze" : "Freeze"}
      >
        <p className="text-sm text-navy-600">Confirm this wallet control for {user.full_name}.</p>
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Inactivate distributor" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); props.patchStatus("SUSPENDED"); }} submitLabel="Inactivate">
        <p className="text-sm text-navy-600">They will not be able to sign in until you reactivate them from user administration.</p>
      </FormModal>
    </>
  );
}

export function AdminRetailerDetail() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [distributorId, setDistributorId] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("CREDIT");
  const [narration, setNarration] = useState("");
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

  async function load() {
    const [u, d] = await Promise.all([
      api<UserDetail>(`/api/v1/admin/users/${id}`, { token }),
      api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }),
    ]);
    setUser(u);
    setDistributors(d);
    setDistributorId(u.parent_id ?? "");
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
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/status`, { token, method: "PATCH", body: JSON.stringify({ status }) }));
      setModal(null);
      flash.ok(`Retailer is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function transfer(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/distributor`, { token, method: "PATCH", body: JSON.stringify({ distributorId }) }));
      setModal(null);
      flash.ok("Outlet moved to the new distributor and hub.");
    } catch (e) {
      flash.fail(e, "Transfer failed");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, { token, method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setModal(null);
      flash.ok("Password reset.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function adjust(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/adjust`, {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), direction, narration }),
      }));
      setAmount("");
      setNarration("");
      setModal(null);
      flash.ok("Wallet adjustment posted.");
    } catch (e) {
      flash.fail(e, "Adjustment failed");
    }
  }

  async function freeze(frozen: boolean) {
    try {
      setUser(await api<UserDetail>(`/api/v1/admin/users/${id}/wallet/freeze`, { token, method: "PATCH", body: JSON.stringify({ frozen }) }));
      setModal(null);
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
  const ekycVerified = agentEkycVerified(user);
  const ekycLinkOpened = agentEkycLinkOpened(user);
  const isFrozen = user.wallet?.status === "FROZEN";
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
    {
      label: "Transfer distributor",
      icon: <ArrowLeftRight className="h-4 w-4" />,
      onClick: () => setModal("transfer"),
    },
    {
      label: "Adjust wallet",
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => setModal("adjust"),
    },
    {
      label: isFrozen ? "Unfreeze wallet" : "Freeze wallet",
      icon: isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      onClick: () => setModal("freeze"),
    },
    ...(user.status === "PENDING" || user.status === "REJECTED"
      ? [
          {
            label: "Request Activation",
            icon: <Send className="h-4 w-4" />,
            onClick: () => setModal("activation"),
          },
        ]
      : []),
    ...(user.status === "ACTIVE"
      ? [
          {
            label: "Inactivate",
            icon: <UserX className="h-4 w-4" />,
            onClick: () => setModal("inactivate"),
            tone: "danger" as const,
          },
        ]
      : []),
    ...(user.status === "APPROVED"
      ? [
          {
            label: "Activate retailer",
            icon: <BadgeCheck className="h-4 w-4" />,
            onClick: () => {
              api(`/api/v1/finance/retailers/${id}/activate`, { token, method: "POST", body: "{}" })
                .then(() => load())
                .then(() => flash.ok("Retailer is now active."))
                .catch((e) => flash.fail(e, "Could not activate retailer"));
            },
          },
        ]
      : []),
    {
      label: "Reset password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/retailers"
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
              <EkycBadge status={agentKycStatus(user) === "VERIFIED" ? "VERIFIED" : "NOT_STARTED"} />
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

            {/* 2nd Row: Distributor & Hub (without links) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Distributor:{" "}
                  <span className="font-medium text-slate-200">
                    {user.parent_name || "Direct Outlet (No Distributor)"}
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
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
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
            <SalesTable rows={sales} detailBase="/admin/sales" hideRetailer showChannel={false} />
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
              <ViewLink key={`${t.id}-v`} href={`/admin/transactions/${t.id}`} />,
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
            onClose={() => setEkycOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
          <AgentEkycStatusModal
            open={statusOpen}
            userId={id}
            userName={user.full_name}
            token={token}
            onClose={() => setStatusOpen(false)}
            onVerified={() => { load().catch(() => undefined); }}
          />
        </>
      )}

      <FormModal open={modal === "transfer"} title="Transfer distributor" description="Moves the outlet and its hub." onClose={() => setModal(null)} onSubmit={transfer} submitLabel="Transfer">
        <SelectField label="Distributor" required value={distributorId} onChange={setDistributorId} options={distributors.map((d) => ({ value: d.id, label: `${d.full_name}${d.hub_name ? ` · ${d.hub_name}` : ""}` }))} />
      </FormModal>
      <FormModal open={modal === "password"} title="Reset password" onClose={() => setModal(null)} onSubmit={resetPassword} submitLabel="Reset password">
        <TextField label="New password" required type="password" value={password} onChange={setPassword} />
      </FormModal>
      <FormModal open={modal === "adjust"} title="Adjust wallet" onClose={() => setModal(null)} onSubmit={adjust} submitLabel="Post adjustment">
        <SelectField label="Direction" required value={direction} onChange={setDirection} options={[{ value: "CREDIT", label: "Credit" }, { value: "DEBIT", label: "Debit" }]} />
        <TextField label="Amount" required inputMode="numeric" value={amount} onChange={setAmount} />
        <TextField label="Narration" value={narration} onChange={setNarration} />
      </FormModal>
      <FormModal open={modal === "freeze"} title={user.wallet?.status === "FROZEN" ? "Unfreeze wallet" : "Freeze wallet"} onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); freeze(user.wallet?.status !== "FROZEN"); }} submitLabel={user.wallet?.status === "FROZEN" ? "Unfreeze" : "Freeze"}>
        <p className="text-sm text-navy-600">Confirm wallet control for {user.full_name}.</p>
      </FormModal>
      <FormModal open={modal === "inactivate"} title="Inactivate retailer" onClose={() => setModal(null)} onSubmit={(e) => { e.preventDefault(); patchStatus("SUSPENDED"); }} submitLabel="Inactivate">
        <p className="text-sm text-navy-600">The outlet desk will not accept new transactions until reactivated.</p>
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
