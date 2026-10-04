"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  BadgeCheck, 
  Copy, 
  CreditCard, 
  LayoutGrid, 
  MapPin, 
  MoreVertical, 
  Pencil,
  Phone,
  Mail,
  User,
  ShoppingBag,
  Receipt,
  ArrowRight
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { FormModal, ViewLink } from "@/features/admin/AdminChrome";
import { CustomerFields, type CustomerDraft } from "@/features/sales/customer-form";
import { AddProductModal } from "@/features/sales/AddProductModal";
import { SellFdCardModal } from "@/features/sales/SellFdCardModal";
import { productTitle } from "@/features/sales/CatalogShowcase";
import { EkycComingSoonModal } from "@/features/ekyc/EkycComingSoonModal";

type Service = { id: string; item_code?: string; item_name: string; category_name: string; state: string; budget?: number; created_at?: string; link_opened_at?: string };
type Txn = { id: string; txn_type: string; state: string; amount: number; created_at?: string };
type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  ekyc_status?: string;
  ekyc_verified_at?: string;
  ovd_type?: string;
  ovd_last4?: string;
  retailer_name?: string;
  created_at?: string;
  desk_manageable?: boolean;
  services: Service[];
  transactions: Txn[];
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function CardOverflowMenu({
  items,
}: {
  items: { label: string; onClick: () => void; icon: ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20" ref={ref}>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20 transition hover:bg-white/20 hover:text-white"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold text-navy-950 hover:bg-slate-50 transition-colors"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <span className="text-slate-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustomerHistory({ basePath, manage = false }: { basePath: string; manage?: boolean }) {
  const token = useSession((s) => s.token);
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"products" | "transactions">("products");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ekycOpen, setEkycOpen] = useState(false);

  function load() {
    if (!token || !id) return;
    api<Customer>(`/api/v1/customers/${id}`, { token })
      .then(setCustomer)
      .catch((e) => setError(formatApiError(e, "Could not load customer")));
  }

  useEffect(() => {
    load();
  }, [token, id]);

  function startEdit() {
    if (!customer) return;
    setDraft({
      mobile: customer.mobile,
      fullName: customer.full_name,
      email: customer.email ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      pincode: customer.pincode ?? "",
    });
    setFormError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft || !id) return;
    setBusy(true);
    setFormError(null);
    try {
      setCustomer(await api<Customer>(`/api/v1/customers/${id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          email: draft.email || null,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      }));
      setEditing(false);
    } catch (err) {
      setFormError(formatApiError(err, "Could not update the customer"));
    } finally {
      setBusy(false);
    }
  }

  async function copyMobile() {
    if (!customer) return;
    await navigator.clipboard.writeText(customer.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!customer) return <div className="card h-64 animate-pulse bg-slate-50" />;

  const volume = customer.transactions.reduce((sum, txn) => sum + Number(txn.amount ?? 0), 0);
  const place = [customer.city, customer.state].filter(Boolean).join(", ");
  const sellFd = basePath === "/agent/customers";
  const salesBase = basePath.startsWith("/distributor")
    ? "/distributor/sales"
    : basePath.startsWith("/admin")
      ? "/admin/sales"
      : "/agent/sales";
  const ready = !!draft && draft.mobile.length === 10 && draft.fullName.trim() && draft.city.trim() && draft.state && draft.pincode.length === 6;
  const ekycVerified = customer.ekyc_status === "VERIFIED";
  const canManage = manage && customer.desk_manageable !== false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={basePath} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors">
          ← Back to Customers Book
        </Link>
        <span className="text-xs text-slate-400 font-mono">CID: {customer.id}</span>
      </div>

      {/* Main Luxury Customer Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          {canManage && (
            <CardOverflowMenu
              items={[
                ...(!ekycVerified
                  ? [{ label: "Complete eKYC", onClick: () => setEkycOpen(true), icon: <BadgeCheck className="h-4 w-4 text-emerald-500" /> }]
                  : []),
                { label: "Edit Profile", onClick: startEdit, icon: <Pencil className="h-4 w-4" /> },
              ]}
            />
          )}

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pr-12">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-black text-navy-950 shadow-lg shadow-emerald-500/20">
                {initials(customer.full_name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {customer.full_name}
                  </h1>
                  <EkycBadge status={customer.ekyc_status} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {customer.mobile}
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
                  {customer.email && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {customer.email}
                      </span>
                    </>
                  )}
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {place || "Location not set"}
                    {customer.pincode ? ` · ${customer.pincode}` : ""}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {customer.retailer_name && <span>Sourced via: {customer.retailer_name} · </span>}
                  <span>Added {when(customer.created_at)}</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="relative z-10 flex flex-wrap gap-2 mt-4 md:mt-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-navy-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors"
                  onClick={() => setAddOpen(true)}
                >
                  {sellFd ? <CreditCard className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  {sellFd ? "Sell FD Card" : "Add Service Lead"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Products Subscribed</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{customer.services.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active product applications</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Counter Transactions</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy-950">{customer.transactions.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Total counter payments</p>
          </div>
          <div className="p-6 transition-colors hover:bg-slate-50/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cumulative Volume</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-600">{inr(volume)}</p>
            <p className="mt-0.5 text-xs text-slate-500">Lifetime value transacted</p>
          </div>
        </div>
      </section>

      {/* Tabs & Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
          {(["products", "transactions"] as const).map((key) => (
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
              {key === "products" ? "Product Applications" : "Counter Transactions"}
            </button>
          ))}
        </div>

        {tab === "products" ? (
          customer.services.length === 0 ? (
            <EmptyState title="No products initiated yet" body="Products you start for this customer will appear here with live pipeline progress." />
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <DataTable
                columns={["Product", "Category", "Pipeline Status", "Opened", "When", ""]}
                rows={customer.services.map((s) => [
                  <span key={s.id} className="font-bold text-navy-950">{productTitle(s.item_code ?? "", s.item_name)}</span>,
                  s.category_name,
                  <StatusPill key={`${s.id}-state`} value={s.state} />,
                  s.link_opened_at ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Opened</span> : <span className="text-xs text-slate-400">Not opened</span>,
                  when(s.created_at),
                  <ViewLink key={`${s.id}-view`} href={`${salesBase}/${s.id}`} />,
                ])}
              />
            </div>
          )
        ) : customer.transactions.length === 0 ? (
          <EmptyState title="No transactions recorded yet" body="Completed desk transactions for this customer will appear here." />
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <DataTable
              columns={["When", "Rail / Service", "State", "Amount"]}
              rows={customer.transactions.map((t) => [
                when(t.created_at),
                <span key={t.id} className="font-bold text-navy-950">{t.txn_type.replaceAll("_", " ")}</span>,
                <StatusPill key={`${t.id}-pill`} value={t.state} />,
                <span key={`${t.id}-amt`} className="font-mono font-bold text-navy-950">{inr(t.amount)}</span>,
              ])}
            />
          </div>
        )}
      </section>

      {canManage && id && (sellFd ? (
        <SellFdCardModal
          open={addOpen}
          customerId={id}
          salesPath={salesBase}
          onClose={() => setAddOpen(false)}
        />
      ) : (
        <AddProductModal
          open={addOpen}
          customerId={id}
          customerName={customer.full_name}
          salesPath={salesBase}
          onClose={() => setAddOpen(false)}
        />
      ))}

      <EkycComingSoonModal open={ekycOpen} title="Customer eKYC" onClose={() => setEkycOpen(false)} />

      {draft && (
        <FormModal
          open={editing}
          title="Edit customer details"
          description="Update customer demographic and contact information."
          onClose={() => setEditing(false)}
          onSubmit={save}
          submitLabel={busy ? "Saving…" : "Save Changes"}
          submitDisabled={busy || !ready}
        >
          {formError && <Alert tone="error">{formError}</Alert>}
          <CustomerFields value={draft} onChange={setDraft} />
        </FormModal>
      )}
    </div>
  );
}
