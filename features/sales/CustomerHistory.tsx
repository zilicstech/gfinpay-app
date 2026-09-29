"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, Copy, CreditCard, LayoutGrid, MapPin, MoreVertical, Pencil } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, StatusPill } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { FormModal, ViewLink } from "@/features/admin/AdminChrome";
import { CustomerFields, type CustomerDraft } from "@/features/sales/customer-form";
import { AddProductModal } from "@/features/sales/AddProductModal";
import { SellFdCardModal } from "@/features/sales/SellFdCardModal";
import { productTitle } from "@/features/sales/CatalogShowcase";
import { EkycComingSoonModal } from "@/features/ekyc/EkycComingSoonModal";

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-200";

type Service = { id: string; item_code?: string; item_name: string; category_name: string; state: string; budget?: number; created_at?: string; link_opened_at?: string };
type Txn = { id: string; txn_type: string; state: string; amount: number; created_at?: string };
type Customer = {
  id: string;
  full_name: string;
  mobile: string;
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
    <div className="absolute right-4 top-4 sm:right-6 sm:top-6" ref={ref}>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full text-white/80 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-navy-900/10 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-navy-800 hover:bg-[#f5f5f5]"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <span className="text-navy-500">{item.icon}</span>
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
  if (!customer) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

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
    <div className="space-y-5">
      <Link href={basePath} className="text-sm font-semibold text-navy-700 underline">All customers</Link>

      <section className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <div className="relative bg-black px-5 py-6 text-white sm:px-6">
          {canManage && (
            <CardOverflowMenu
              items={[
                ...(!ekycVerified
                  ? [{ label: "Do eKYC", onClick: () => setEkycOpen(true), icon: <BadgeCheck className="h-4 w-4" /> }]
                  : []),
                { label: "Edit details", onClick: startEdit, icon: <Pencil className="h-4 w-4" /> },
              ]}
            />
          )}
          <div className="flex items-start gap-4 pr-10">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-lg font-semibold text-black">
              {initials(customer.full_name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl tracking-tight">{customer.full_name}</h1>
                <EkycBadge status={customer.ekyc_status} />
              </div>
              <p className="mt-1 flex items-center gap-2 font-mono text-sm tracking-widest text-white/80">
                <span>{customer.mobile}</span>
                <button
                  type="button"
                  className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label={copied ? "Phone number copied" : "Copy phone number"}
                  onClick={copyMobile}
                >
                  <Copy className={`h-3.5 w-3.5 ${copied ? "text-emerald-300" : ""}`} />
                </button>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                {place || "Location not set"}
                {customer.pincode ? ` · ${customer.pincode}` : ""}
              </p>
            </div>
          </div>
          {canManage ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className={primaryActionClass} onClick={() => setAddOpen(true)}>
                {sellFd ? <CreditCard className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {sellFd ? "Sell FD Card" : "Add Product"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 divide-x divide-black/10">
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Products</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{customer.services.length}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Transactions</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{customer.transactions.length}</p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs font-medium text-navy-500">Volume</p>
            <p className="mt-1 font-display text-2xl text-navy-950">{inr(volume)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
          <div className="flex gap-2">
            {(["products", "transactions"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-black text-emerald-300" : "bg-[#f5f5f5] text-navy-700"}`}
                onClick={() => setTab(key)}
              >
                {key === "products" ? "Products" : "Transactions"}
              </button>
            ))}
          </div>
          {tab === "products" ? (
            customer.services.length === 0 ? (
              <EmptyState title="No products yet" body="Products you start for this customer show up here with their status." />
            ) : (
              <DataTable
                columns={["Product", "Category", "Status", "Opened", "When", ""]}
                rows={customer.services.map((s) => [
                  productTitle(s.item_code ?? "", s.item_name),
                  s.category_name,
                  <StatusPill key={`${s.id}-state`} value={s.state} />,
                  s.link_opened_at ? "Yes" : "Not yet",
                  when(s.created_at),
                  <ViewLink key={`${s.id}-view`} href={`${salesBase}/${s.id}`} />,
                ])}
              />
            )
          ) : customer.transactions.length === 0 ? (
            <EmptyState title="No transactions yet" body="Completed transactions for this customer will show up here." />
          ) : (
            <DataTable
              columns={["When", "Type", "State", "Amount"]}
              rows={customer.transactions.map((t) => [
                when(t.created_at),
                t.txn_type.replaceAll("_", " "),
                <StatusPill key={t.id} value={t.state} />,
                inr(t.amount),
              ])}
            />
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
          title="Edit customer"
          description="Update the details on this record."
          onClose={() => setEditing(false)}
          onSubmit={save}
          submitLabel={busy ? "Saving…" : "Save changes"}
          submitDisabled={busy || !ready}
        >
          {formError && <Alert tone="error">{formError}</Alert>}
          <CustomerFields value={draft} onChange={setDraft} />
        </FormModal>
      )}
    </div>
  );
}
