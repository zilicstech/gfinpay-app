"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutGrid,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  Users,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { Flash, FormModal, useFlash } from "@/features/admin/AdminChrome";
import { CustomerFields, type CustomerDraft } from "@/features/sales/customer-form";
import { AddProductModal } from "@/features/sales/AddProductModal";
import { SellFdCardModal } from "@/features/sales/SellFdCardModal";
import { productTitle } from "@/features/sales/CatalogShowcase";
import { EkycComingSoonModal } from "@/features/ekyc/EkycComingSoonModal";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";

type Service = {
  id: string;
  item_code?: string;
  item_name: string;
  category_name: string;
  state: string;
  budget?: number;
  created_at?: string;
  link_opened_at?: string;
};

type Txn = {
  id: string;
  txn_type: string;
  state: string;
  amount: number;
  created_at?: string;
};

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
  vendor_name?: string;
  created_by?: string;
  created_by_code?: string;
  created_at?: string;
  desk_manageable?: boolean;
  services: Service[];
  transactions: Txn[];
};

type TabType = "products" | "transactions" | "profile";

export function CustomerHistory({ basePath, manage = false }: { basePath: string; manage?: boolean }) {
  const token = useSession((s) => s.token);
  const { id } = useParams<{ id: string }>();
  const flash = useFlash();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>("products");

  // Modals & form state
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
      setCustomer(
        await api<Customer>(`/api/v1/customers/${id}`, {
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
        })
      );
      setEditing(false);
      flash.ok("Customer profile updated successfully.");
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
  if (!customer) return <div className="card h-64 animate-pulse bg-slate-100" />;

  const volume = customer.transactions.reduce((sum, txn) => sum + Number(txn.amount ?? 0), 0);
  const place = [customer.city, customer.state].filter(Boolean).join(", ");
  const sellFd = basePath === "/agent/customers";
  const salesBase = basePath.startsWith("/distributor")
    ? "/distributor/sales"
    : basePath.startsWith("/admin")
      ? "/admin/sales"
      : "/agent/sales";
  const ready =
    !!draft &&
    draft.mobile.length === 10 &&
    draft.fullName.trim() &&
    draft.city.trim() &&
    draft.state &&
    draft.pincode.length === 6;
  const ekycVerified = (customer.ekyc_status ?? "").toUpperCase() === "VERIFIED";
  const canManage = manage || customer.desk_manageable !== false;

  const manageActions: ManageAction[] = [
    {
      label: "Edit profile",
      icon: <Pencil className="h-4 w-4" />,
      onClick: startEdit,
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
      label: sellFd ? "Sell FD Card" : "Add service lead",
      icon: sellFd ? <CreditCard className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />,
      onClick: () => setAddOpen(true),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Customers
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Dark Luxury Customer Hero Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            {/* Badges line */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                {basePath.startsWith("/distributor") ? "Network Customer" : "Platform Customer"}
              </span>
              <span className="text-slate-600">·</span>
              <EkycBadge status={customer.ekyc_status} />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {customer.full_name}
              </h1>
            </div>

            {/* Location row */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">
                {place || "Location not set"}
                {customer.pincode ? ` · ${customer.pincode}` : ""}
              </span>
            </div>

            {/* Row 1: Contact & Channel Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>+91 {customer.mobile}</span>
                <button
                  type="button"
                  className="text-emerald-400/70 hover:text-emerald-300 transition-colors ml-0.5"
                  title="Copy Phone"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>

              {customer.email && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{customer.email}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Store className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>
                  {customer.created_by === "VENDOR"
                    ? `Vendor: ${customer.vendor_name ?? "Field Sales"}`
                    : `Counter: ${customer.retailer_name ?? "Retail Outlet"}`}
                </span>
              </span>
            </div>

            {/* Row 2: Creation & CID Details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Added {when(customer.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-400">
                CID: {customer.id}
              </span>
            </div>
          </div>

          {/* Manage Button Menu */}
          {canManage && (
            <div className="shrink-0">
              <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
            </div>
          )}
        </div>
      </section>

      {/* Modern Segmented Tab Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 w-fit">
        {([
          ["products", `Product Applications (${customer.services?.length ?? 0})`],
          ["transactions", `Counter Transactions (${customer.transactions?.length ?? 0})`],
          ["profile", "Profile & Compliance"],
        ] as const).map(([key, label]) => (
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
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCT APPLICATIONS */}
      {tab === "products" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Subscribed Banking Products</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Credit cards, loan applications, and banking services started for this customer.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                onClick={() => setAddOpen(true)}
              >
                {sellFd ? <CreditCard className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                <span>{sellFd ? "Sell FD Card" : "Add Product Lead"}</span>
              </button>
            )}
          </div>

          {!customer.services || customer.services.length === 0 ? (
            <div className="space-y-4 text-center py-6">
              <EmptyState
                title="No product applications initiated"
                body="Banking products and cards initiated for this customer will appear here with live pipeline progress."
              />
              {canManage && (
                <button
                  type="button"
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                  onClick={() => setAddOpen(true)}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Start First Application</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Pipeline Status</th>
                    <th className="px-6 py-4">Link Status</th>
                    <th className="px-6 py-4">Applied On</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.services.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0 ring-1 ring-inset ring-emerald-500/20">
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">
                              {productTitle(s.item_code ?? "", s.item_name)}
                            </p>
                            {s.item_code && (
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {s.item_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {s.category_name}
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={s.state} />
                      </td>

                      <td className="px-6 py-4">
                        {s.link_opened_at ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Opened
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Pending Click
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {when(s.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`${salesBase}/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          {canManage ? "Manage" : "View"}
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
      )}

      {/* TAB 2: COUNTER TRANSACTIONS */}
      {tab === "transactions" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Counter Transactions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Domestic money transfer, bill pay, and cash services transacted at retail counters.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
                {customer.transactions.length} Transactions
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                {inr(volume)} Cumulative Volume
              </span>
            </div>
          </div>

          {!customer.transactions || customer.transactions.length === 0 ? (
            <EmptyState
              title="No counter transactions recorded"
              body="Completed DMT, AePS, and bill pay desk transactions for this customer will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Service Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.transactions.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {when(t.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-navy-950 text-xs sm:text-sm">
                          {t.txn_type.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                        {inr(t.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={t.state} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE & COMPLIANCE */}
      {tab === "profile" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card 1: Consumer Demographics */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-navy-950">Demographic Profile</h3>
                <p className="text-xs text-slate-500">Contact and residential details recorded in registry.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
                <p className="font-display font-bold text-base text-navy-950 mt-1">{customer.full_name}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone</p>
                <p className="font-mono font-bold text-sm text-navy-950 mt-1">+91 {customer.mobile}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="font-medium text-sm text-navy-950 mt-1">{customer.email || "Not provided"}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">City</p>
                <p className="font-medium text-sm text-navy-950 mt-1">{customer.city || "—"}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">State & Pincode</p>
                <p className="font-medium text-sm text-navy-950 mt-1">
                  {customer.state || "—"} {customer.pincode ? `(${customer.pincode})` : ""}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Demographic Information</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Compliance & Identification */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
                <FileCheck2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-navy-950">Compliance & Sourcing</h3>
                <p className="text-xs text-slate-500">Identity verification records and acquisition origin.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">eKYC Verification</p>
                <div className="mt-1.5">
                  <EkycBadge status={customer.ekyc_status} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Date</p>
                <p className="font-medium text-xs text-navy-950 mt-1">
                  {customer.ekyc_verified_at ? when(customer.ekyc_verified_at) : "Pending eKYC"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">OVD Document Type</p>
                <p className="font-mono font-bold text-xs text-navy-950 mt-1">
                  {customer.ovd_type ?? "None recorded"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Last 4 Digits</p>
                <p className="font-mono font-bold text-xs text-navy-950 mt-1">
                  {customer.ovd_last4 ? `•••• •••• ${customer.ovd_last4}` : "—"}
                </p>
              </div>
            </div>

            {/* Acquisition Channel strip */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Originating Channel</p>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-navy-950">
                  {customer.created_by === "VENDOR"
                    ? customer.vendor_name ?? "Affiliate Vendor Agency"
                    : customer.retailer_name ?? "Platform Retail Counter"}
                </span>
                {customer.created_by_code && (
                  <span className="font-mono text-slate-500">({customer.created_by_code})</span>
                )}
              </div>
            </div>

            {!ekycVerified && canManage && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setEkycOpen(true)}
                  className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Initiate Customer eKYC</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
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
          title="Edit Customer Profile"
          description="Update contact and location information recorded for this customer."
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
