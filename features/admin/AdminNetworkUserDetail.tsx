"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Building2, Copy, Plus, Store } from "lucide-react";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { AgentEkycModal, agentEkycVerified, agentKycStatus } from "@/features/admin/AgentEkycModal";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { inr, maskMobile, when, createdByLabel } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, ViewLink, useFlash } from "@/features/admin/AdminChrome";
import { emptyRetailerDraft, RetailerOnboardFields, retailerDraftReady, type RetailerDraft } from "@/features/admin/retailer-form";
import { retailerLocationFromKyc, retailerLocationLine } from "@/features/admin/retailer-location";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { SalesTable, type SalesLead } from "@/features/sales/SalesTable";
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

type DistributorModal = "hub" | "password" | "adjust" | "freeze" | "inactivate" | "retailer" | null;

type RetailerModal = "transfer" | "password" | "adjust" | "freeze" | "inactivate" | null;

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
          password: retailerDraft.password,
          email: `${retailerDraft.mobile}@gfinpay.com`,
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

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const hubLine = [user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ");
  const ekycVerified = agentEkycVerified(user);
  const manageActions: ManageAction[] = [
    { label: "Change hub", onClick: () => setModal("hub") },
    { label: "Adjust wallet", onClick: () => setModal("adjust") },
    { label: "Freeze wallet", onClick: () => setModal("freeze") },
    ...(user.status === "ACTIVE" ? [{ label: "Inactivate", onClick: () => setModal("inactivate") }] : []),
    { label: "Reset password", onClick: () => setModal("password") },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/distributors" className="text-sm font-semibold text-navy-700 underline">
        All distributors
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <section className="rounded-3xl border border-black/10 bg-white">
        <div className="relative rounded-t-3xl bg-black px-5 py-6 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
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
                  <Building2 className="h-3.5 w-3.5" />
                  {hubLine || "No hub assigned"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Appointed {when(user.created_at)} · by {createdByLabel(user.created_by_name, user.created_by_code)}
                </p>
              </div>
            </div>
            <ManageMenu actions={manageActions} variant="onDark" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryActionClass}
              disabled={user.status !== "ACTIVE"}
              onClick={() => setModal("retailer")}
            >
              <Plus className="h-4 w-4" /> Add retailer
            </button>
            {!ekycVerified && (
              <button type="button" className={primaryActionClass} onClick={() => setEkycOpen(true)}>
                <BadgeCheck className="h-4 w-4" /> Do eKYC
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-black/10 rounded-b-3xl">
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Available float</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(user.wallet?.availableBalance)}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">On hold</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(user.wallet?.holdBalance)}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Retailers</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{user.retailers?.length ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2">
          {(["retailers", "customers", "transactions"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-black text-emerald-300" : "bg-[#f5f5f5] text-navy-700"}`}
              onClick={() => setTab(key)}
            >
              {key === "retailers" ? "Retailers" : key === "customers" ? "Customers" : "Transactions"}
            </button>
          ))}
        </div>
        {tab === "retailers" ? (
          !user.retailers?.length ? (
            <EmptyState title="No retailers yet" body="Add a retailer to place under this distributor." />
          ) : (
            <DataTable
              columns={["Retailer", "Code", "Location", "Mobile", "eKYC", "Status", ""]}
              rows={user.retailers.map((r) => [
                r.full_name,
                r.code ?? "—",
                retailerLocationLine({
                  city: r.city ?? r.retailer_city,
                  state: r.state ?? r.retailer_state,
                  pincode: r.pincode ?? r.retailer_pincode,
                }),
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
            <div className="card h-32 animate-pulse bg-[#f5f5f5]" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" body="Customers appear when this distributor or their retailers add them at the desk." />
          ) : (
            <DataTable
              columns={["Name", "Mobile", "City", "Retailer", "Created by", "Code", "eKYC", "Added"]}
              rows={customers.map((c) => [
                c.full_name,
                maskMobile(c.mobile),
                [c.city, c.state].filter(Boolean).join(", ") || "—",
                c.retailer_name ?? "—",
                c.created_by ?? "—",
                c.created_by_code ?? "—",
                <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
                c.created_at ? when(c.created_at) : "—",
              ])}
            />
          )
        ) : !user.recentTransactions?.length ? (
          <EmptyState title="No transactions yet" body="Ledger activity for this distributor appears here." />
        ) : (
          <DataTable
            columns={["When", "Type", "State", "Amount", ""]}
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
          mobile={user.mobile}
          token={token}
          onClose={() => setEkycOpen(false)}
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
  const [tab, setTab] = useState<"sales" | "customers" | "transactions">("sales");
  const [sales, setSales] = useState<SalesLead[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [customers, setCustomers] = useState<RetailerCustomer[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);

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

  if (loadError) return <Alert tone="error">{loadError}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const location = retailerLocationFromKyc(user.kyc) ?? {
    city: user.retailer_city,
    state: user.retailer_state,
    pincode: user.retailer_pincode,
  };
  const shopLine = retailerLocationLine(location);
  const ekycVerified = agentEkycVerified(user);
  const manageActions: ManageAction[] = [
    { label: "Transfer distributor", onClick: () => setModal("transfer") },
    { label: "Adjust wallet", onClick: () => setModal("adjust") },
    { label: "Freeze wallet", onClick: () => setModal("freeze") },
    ...(user.status === "ACTIVE" ? [{ label: "Inactivate", onClick: () => setModal("inactivate") }] : []),
    { label: "Reset password", onClick: () => setModal("password") },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/retailers" className="text-sm font-semibold text-navy-700 underline">
        All retailers
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <section className="rounded-3xl border border-black/10 bg-white">
        <div className="relative rounded-t-3xl bg-black px-5 py-6 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
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
                {user.parent_name ? (
                  <Link href={`/admin/distributors/${user.parent_id}`} className="underline decoration-white/30 hover:decoration-white">
                    {user.parent_name}
                  </Link>
                ) : (
                  "No distributor"
                )}
                {user.hub_name ? ` · ${user.hub_name}` : ""}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Onboarded {when(user.created_at)} · by {createdByLabel(user.created_by_name, user.created_by_code)}
              </p>
            </div>
            </div>
            <ManageMenu actions={manageActions} variant="onDark" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {!ekycVerified && (
              <button type="button" className={primaryActionClass} onClick={() => setEkycOpen(true)}>
                <BadgeCheck className="h-4 w-4" /> Do eKYC
              </button>
            )}
          </div>
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
            <SalesTable rows={sales} detailBase="/admin/sales" hideRetailer />
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
          mobile={user.mobile}
          token={token}
          onClose={() => setEkycOpen(false)}
        />
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
    </div>
  );
}
