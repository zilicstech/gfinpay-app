"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, PageHeader } from "@/components/ui/primitives";
import { EkycBadge } from "@/features/sales/EkycBadge";
import { FormModal } from "@/features/admin/AdminChrome";
import { CustomerFields, emptyCustomerDraft, type CustomerDraft } from "@/features/sales/customer-form";

type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  pincode?: string;
  ekyc_status?: string;
  created_by?: string;
  created_by_code?: string;
  retailer_name?: string;
};

export function DeskCustomersPage({ basePath }: { basePath: "/agent/customers" | "/distributor/customers" }) {
  const isDistributor = basePath === "/distributor/customers";
  const token = useSession((s) => s.token);
  const router = useRouter();
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyCustomerDraft());
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(() => {
      const digits = query.replace(/\D/g, "");
      const path = digits ? `/api/v1/customers?mobile=${digits}` : "/api/v1/customers";
      api<Customer[]>(path, { token })
        .then((next) => {
          setRows(next);
          setError(null);
        })
        .catch((e) => setError(formatApiError(e, "Could not load customers")))
        .finally(() => setLoaded(true));
    }, 250);
    return () => clearTimeout(handle);
  }, [token, query]);

  function closeModal() {
    setOpen(false);
    setDraft(emptyCustomerDraft());
    setFormError(null);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const created = await api<Customer>("/api/v1/customers", {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          mobile: draft.mobile,
          city: draft.city.trim(),
          state: draft.state,
          pincode: draft.pincode,
        }),
      });
      openDetails(`${basePath}/${created.id}`, (href) => router.push(href));
    } catch (err) {
      setFormError(formatApiError(err, "Could not save the customer"));
    } finally {
      setBusy(false);
    }
  }

  const searching = query.replace(/\D/g, "").length > 0;
  const ready = draft.mobile.length === 10 && draft.fullName.trim() && draft.city.trim() && draft.state && draft.pincode.length === 6;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={
          isDistributor
            ? "Customers you added or that your retailers added. Open a row to manage products and history."
            : "People you have added. Open a customer to see their record and history."
        }
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        }
      />
      {error && <Alert tone="error">{error}</Alert>}
      <label className="relative block max-w-md">
        <span className="sr-only">Search by phone number</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden />
        <input
          className="field !pl-12 pr-3.5 tracking-widest"
          inputMode="numeric"
          maxLength={10}
          placeholder="Search by phone number"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </label>
      {!loaded ? (
        <div className="card h-40 animate-pulse bg-[#f5f5f5]" />
      ) : rows.length === 0 ? (
        <EmptyState
          title={searching ? "No customer with this number" : "No customers yet"}
          body={
            searching
              ? "Try another mobile, or add them if they are new."
              : isDistributor
                ? "Add a customer yourself, or they appear when a retailer in your network adds them."
                : "Add a customer to start their record."
          }
        />
      ) : (
        <DataTable
          columns={
            isDistributor
              ? ["Name", "Mobile", "City", "Retailer", "Created by", "Code", "eKYC", ""]
              : ["Name", "Mobile", "City", "Created by", "Code", "eKYC", ""]
          }
          rows={rows.map((c) => {
            const core = [
              <Link key={`${c.id}-name`} href={`${basePath}/${c.id}`} className="font-semibold text-navy-950 hover:underline">
                {c.full_name}
              </Link>,
              c.mobile,
              [c.city, c.state].filter(Boolean).join(", ") || "—",
            ];
            if (isDistributor) {
              core.push(c.retailer_name ?? "—");
            }
            core.push(
              c.created_by ?? "—",
              c.created_by_code ?? "—",
              <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
              <Link key={c.id} href={`${basePath}/${c.id}`} className="text-sm font-semibold text-brand-700">
                Open
              </Link>,
            );
            return core;
          })}
        />
      )}

      <FormModal
        open={open}
        title="Add customer"
        description="Mobile, name, and where they are. You can edit this later."
        onClose={closeModal}
        onSubmit={create}
        submitLabel={busy ? "Saving…" : "Save customer"}
        submitDisabled={busy || !ready}
      >
        {formError && <Alert tone="error">{formError}</Alert>}
        <CustomerFields value={draft} onChange={setDraft} />
      </FormModal>
    </div>
  );
}
