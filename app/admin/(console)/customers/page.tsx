"use client";

import { useEffect, useState } from "react";
import { Search, Shield, Store, Users } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, DataTable, EmptyState, PageHeader } from "@/components/ui/primitives";
import { ViewLink } from "@/features/admin/AdminChrome";
import { EkycBadge } from "@/features/sales/EkycBadge";

type Customer = {
  id: string;
  full_name: string;
  mobile: string;
  city?: string;
  state?: string;
  pincode?: string;
  retailer_name?: string;
  ekyc_status?: string;
  created_by?: string;
  created_by_code?: string;
  created_by_name?: string;
  created_at?: string;
};

function locationLine(c: Customer) {
  return [c.city, c.state].filter(Boolean).join(", ") || "—";
}

const CREATED_BY_MARK: Record<string, { label: string; Icon: typeof Store; chip: string; disc: string }> = {
  ADMIN: {
    label: "Admin",
    Icon: Shield,
    chip: "bg-black text-emerald-300",
    disc: "bg-emerald-300 text-black",
  },
  DISTRIBUTOR: {
    label: "Distributor",
    Icon: Users,
    chip: "bg-navy-950 text-white",
    disc: "bg-white/15 text-emerald-300",
  },
  RETAILER: {
    label: "Retailer",
    Icon: Store,
    chip: "bg-navy-950 text-white",
    disc: "bg-white/15 text-emerald-300",
  },
};

function CreatedByCell({ name, role }: { name?: string; role?: string }) {
  const mark = role ? CREATED_BY_MARK[role] : undefined;
  const displayName = name || "—";
  const Icon = mark?.Icon;

  return (
    <div className="min-w-[9rem]">
      <p className="truncate text-sm font-semibold leading-tight text-navy-950">{displayName}</p>
      {mark && Icon ? (
        <span className={`mt-1 inline-flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 ${mark.chip}`}>
          <span className={`grid h-4 w-4 place-items-center rounded-full ${mark.disc}`}>
            <Icon className="h-2.5 w-2.5" aria-hidden />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{mark.label}</span>
        </span>
      ) : null}
    </div>
  );
}

export default function AdminCustomersPage() {
  const token = useSession((s) => s.token);
  const [rows, setRows] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  const searching = query.replace(/\D/g, "").length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network"
        title="Customers"
        description="Everyone added by distributors, retailers, or admins. Open a row for the customer record."
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
          body={searching ? "Try another mobile." : "They appear when a distributor, retailer, or admin adds someone."}
        />
      ) : (
        <DataTable
          columns={["Name", "Location", "Created by", "Code", "Owner", "eKYC", "Added", ""]}
          rows={rows.map((c) => [
            c.full_name,
            <div key={`${c.id}-loc`}>
              <p className="font-medium text-navy-950">{locationLine(c)}</p>
              {c.pincode ? <p className="mt-0.5 text-xs text-navy-500">{c.pincode}</p> : null}
            </div>,
            <CreatedByCell
              key={`${c.id}-by`}
              name={c.created_by_name || c.created_by_code}
              role={c.created_by}
            />,
            c.created_by_code ?? "—",
            c.retailer_name ?? "—",
            <EkycBadge key={`${c.id}-kyc`} status={c.ekyc_status} />,
            c.created_at ? when(c.created_at) : "—",
            <ViewLink key={`${c.id}-v`} href={`/admin/customers/${c.id}`} />,
          ])}
        />
      )}
    </div>
  );
}
