"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, Modal } from "@/components/ui/primitives";
import { entityPrimaryActionClass } from "@/features/console/EntityChrome";
import { SaleDetail, type SaleLead } from "@/features/sales/SaleDetail";

type PartnerStatus = Record<string, string>;

type StatusResult = { lead: SaleLead; partner: PartnerStatus };

const PARTNER_FIELDS: { key: string; label: string }[] = [
  { key: "txn_status", label: "Transaction status" },
  { key: "ex_status", label: "Executive status" },
  { key: "ex_sub_status", label: "Sub-status" },
  { key: "ex_remarks", label: "Remarks" },
  { key: "last_update_date", label: "Last update" },
  { key: "refid", label: "Ref id" },
  { key: "merchantcode", label: "Merchant code" },
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "pan", label: "PAN" },
  { key: "product", label: "Product" },
  { key: "referral_link", label: "Referral link" },
  { key: "resume_link", label: "Resume link" },
];

function displayValue(key: string, raw: string | undefined): ReactNode {
  const value = (raw ?? "").trim();
  if (!value) return "—";
  if ((key === "referral_link" || key === "resume_link") && /^https?:\/\//i.test(value)) {
    return (
      <a className="text-brand-700 underline" href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    );
  }
  return value;
}

export default function AdminSaleDetailPage() {
  const token = useSession((s) => s.token);
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<SaleLead | null>(null);
  const [partner, setPartner] = useState<PartnerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (token && id) api<SaleLead>(`/api/v1/sales/${id}`, { token }).then(setLead).catch((e) => setError(formatApiError(e, "Could not load the lead")));
  }, [token, id]);

  const paysprintFd = lead
    && (lead.provider === "PAYSPRINT" || lead.rail === "PAYSPRINT_FD")
    && (lead.category_code === "FD_CARD" || lead.category_name?.toLowerCase().includes("fd"));

  async function checkStatus() {
    if (!token || !id) return;
    setStatusOpen(true);
    setBusy(true);
    setPartner(null);
    setError(null);
    try {
      const result = await api<StatusResult>(`/api/v1/sales/${id}/utm-status`, { token, method: "POST" });
      setLead(result.lead);
      setPartner(result.partner ?? {});
    } catch (e) {
      setError(formatApiError(e, "Could not check PaySprint status"));
    } finally {
      setBusy(false);
    }
  }

  const knownKeys = new Set(PARTNER_FIELDS.map((f) => f.key));
  const extraPartnerRows = Object.entries(partner ?? {})
    .filter(([key, value]) => !knownKeys.has(key) && String(value ?? "").trim() !== "")
    .map(([key, value]) => ({ key, label: key.replaceAll("_", " "), value }));

  if (error && !lead && !statusOpen) return <Alert tone="error">{error}</Alert>;
  if (!lead) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  return (
    <div className="space-y-4">
      {error && !statusOpen && <Alert tone="error">{error}</Alert>}
      <SaleDetail
        backHref="/admin/sales"
        backLabel="All sales"
        lead={lead}
        extraActions={
          paysprintFd ? (
            <button type="button" className={entityPrimaryActionClass} disabled={busy} onClick={checkStatus}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              {busy ? "Checking…" : "Check status"}
            </button>
          ) : null
        }
      />
      <Modal
        open={statusOpen}
        title="PaySprint status"
        description={busy ? "Checking this card with PaySprint…" : "Latest status returned for this sale."}
      >
        {busy ? (
          <div className="card h-28 animate-pulse bg-[#f5f5f5]" />
        ) : (
          <div className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {partner && (
              <dl className="divide-y divide-navy-900/10 overflow-hidden rounded-2xl border border-navy-900/10">
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                  <dt className="text-xs font-medium text-navy-500">Sale state</dt>
                  <dd className="text-sm font-medium text-navy-950">{lead.state.replaceAll("_", " ")}</dd>
                </div>
                {PARTNER_FIELDS.map((field) => (
                  <div key={field.key} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                    <dt className="text-xs font-medium text-navy-500">{field.label}</dt>
                    <dd className="break-all text-sm font-medium text-navy-950">{displayValue(field.key, partner[field.key])}</dd>
                  </div>
                ))}
                {extraPartnerRows.map((row) => (
                  <div key={row.key} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                    <dt className="text-xs font-medium capitalize text-navy-500">{row.label}</dt>
                    <dd className="break-all text-sm font-medium text-navy-950">{displayValue(row.key, row.value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setStatusOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
