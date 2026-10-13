"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Copy,
  CreditCard,
  LayoutGrid,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Store,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { Flash, FormModal, useFlash } from "@/features/admin/AdminChrome";
import { CustomerFields, type CustomerDraft } from "@/features/sales/customer-form";
import { AddProductModal } from "@/features/sales/AddProductModal";
import { SellFdCardModal } from "@/features/sales/SellFdCardModal";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { funnelStepLabel, type SalesLead } from "@/features/sales/SalesTable";
import { productTitle } from "@/features/sales/CatalogShowcase";

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
  services: SalesLead[];
  transactions: Txn[];
};

type TabType = "products" | "transactions";

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
  const canManage = manage || customer.desk_manageable !== false;
  const isAdmin = basePath.startsWith("/admin");
  const canAddLead = !isAdmin && canManage;

  const manageActions: ManageAction[] = [
    {
      label: "Edit profile",
      icon: <Pencil className="h-4 w-4" />,
      onClick: startEdit,
    },
    ...(canAddLead
      ? [
          {
            label: sellFd ? "Sell FD Card" : "Add service lead",
            icon: sellFd ? <CreditCard className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />,
            onClick: () => setAddOpen(true),
          },
        ]
      : []),
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

            {/* Row 2: Creation Details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Added {when(customer.created_at)}</span>
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
          ["products", `Sales (${customer.services?.length ?? 0})`],
          ["transactions", `Transactions (${customer.transactions?.length ?? 0})`],
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

      {/* TAB 1: SALES */}
      {tab === "products" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Sales</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial products, credit cards, and loan applications initiated for this customer.
              </p>
            </div>
            {canAddLead && (
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
                title="No sales leads yet"
                body="Banking products and cards initiated for this customer will appear here with live pipeline progress."
              />
              {canAddLead && (
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
                    <th className="px-6 py-4">Funnel Step</th>
                    <th className="px-6 py-4">Created On</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.services.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50/60 group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 shrink-0">
                            <CreditCard className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">
                              {productTitle(
                                s.item_code ?? s.product_code ?? "",
                                s.item_name ?? s.product_code ?? "Financial Product"
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {s.sale_provider ?? "Bank Partner"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {s.category_name}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          {funnelStepLabel(s)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {s.created_at ? when(s.created_at) : "—"}
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={s.state} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`${salesBase}/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Inspect
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

      {/* TAB 2: TRANSACTIONS */}
      {tab === "transactions" && (
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-xl font-bold text-navy-950">Transactions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Domestic money transfer, bill pay, and cash services transacted for this customer.
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
              title="No transactions recorded"
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

      {/* MODALS */}
      {canAddLead && id && (sellFd ? (
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
