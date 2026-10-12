"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, FileUp, IndianRupee, Receipt } from "lucide-react";
import { api, apiForm } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { CollectionAccounts } from "@/features/finance/CollectionAccounts";
import { ProofViewerModal } from "@/features/finance/ProofViewerModal";
import { formatFinanceKind, formatTransferMode, type FinanceKind, type FinanceRequest } from "@/features/finance/types";

export { formatFinanceKind };

export function FinanceRequestCard({
  token,
  kind,
  retailerId,
  retailerStatus,
  canSubmit,
  canActivate,
  defaultAmount,
  onChanged,
}: {
  token: string | null;
  kind: FinanceKind;
  retailerId?: string;
  retailerStatus?: string;
  canSubmit?: boolean;
  canActivate?: boolean;
  defaultAmount?: number;
  onChanged?: () => void;
}) {
  const flash = useFlash();
  const [rows, setRows] = useState<FinanceRequest[]>([]);
  const [amount, setAmount] = useState(String(defaultAmount ?? (kind === "ACTIVATION" ? 5000 : "")));
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const latest = rows[0];
  const pending = latest?.status === "PENDING";
  const received = rows.some((r) => r.status === "RECEIVED");
  const live = retailerStatus === "ACTIVE";
  const title = kind === "ACTIVATION" ? "Activation payment" : "Wallet top-up request";
  const endpoint = kind === "ACTIVATION" ? "/api/v1/finance/activation-requests" : "/api/v1/finance/wallet-requests";

  async function load() {
    if (!token) return;
    try {
      const params = new URLSearchParams({ kind });
      if (retailerId) params.set("retailerId", retailerId);
      const data = await api<FinanceRequest[]>(`/api/v1/finance/requests?${params}`, { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      flash.fail(e, "Could not load payment requests");
    }
  }

  useEffect(() => {
    load();
  }, [token, kind, retailerId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    const form = new FormData();
    if (retailerId) form.set("retailerId", retailerId);
    form.set("amount", amount);
    form.set("utr", utr.trim());
    form.set("proof", file);
    setBusy(true);
    try {
      await apiForm(endpoint, form, { token });
      setUtr("");
      setFile(null);
      flash.ok(kind === "ACTIVATION"
        ? "Activation request submitted. An auditor will verify the payment."
        : "Wallet request submitted. Amount credits after auditor confirmation.");
      await load();
      onChanged?.();
    } catch (err) {
      flash.fail(err, "Could not submit the request");
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/finance/retailers/${retailerId}/activate`, { token, method: "POST", body: "{}" });
      flash.ok("Retailer is now active and can use the platform.");
      await load();
      onChanged?.();
    } catch (err) {
      flash.fail(err, "Could not activate retailer");
    } finally {
      setBusy(false);
    }
  }

  if (!canSubmit && !canActivate && rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Finance
          </span>
          <h2 className="mt-2 font-display text-xl font-bold text-navy-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {kind === "ACTIVATION"
              ? "Submit UTR and payment proof. After the auditor marks it received, admin or distributor can activate the outlet."
              : "Submit UTR and payment proof. The auditor credit lands in the retailer wallet automatically."}
          </p>
        </div>
        {latest && <StatusPill value={latest.status} />}
      </div>

      <Flash message={flash.message} error={flash.error} />

      {latest && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Meta label="Amount" value={inr(latest.amount)} />
          <Meta label="UTR" value={latest.utr} mono />
          <Meta label="Submitted" value={latest.created_at ? when(latest.created_at) : "—"} />
          {latest.transfer_mode && <Meta label="Mode" value={formatTransferMode(latest.transfer_mode)} />}
          {latest.collection_bank_name && (
            <Meta
              label="Paid to"
              value={`${latest.collection_bank_name} · ${latest.collection_account_number ?? ""}`}
              mono
            />
          )}
          {latest.payout_bank_name && (
            <Meta
              label="Pay to"
              value={`${latest.payout_bank_name} · ${latest.payout_account_number ?? ""}`}
              mono
            />
          )}
          {latest.auditor_name && <Meta label="Reviewed by" value={latest.auditor_name} />}
          {latest.auditor_notes && <Meta label="Notes" value={latest.auditor_notes} />}
          {latest.proof_filename && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Proof</p>
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-navy-950 underline"
                onClick={() => setProofOpen(true)}
              >
                {latest.proof_filename}
              </button>
            </div>
          )}
        </div>
      )}

      {canActivate && received && !live && (
        <button type="button" className="btn-primary inline-flex items-center gap-2" disabled={busy} onClick={activate}>
          <BadgeCheck className="h-4 w-4" />
          Activate retailer
        </button>
      )}

      {canSubmit && !pending && !(kind === "ACTIVATION" && (live || received)) && (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
          <CollectionAccounts token={token} />
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount (₹)</span>
            <span className="relative block">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="field !pl-9"
                type="number"
                min={1}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">UTR / UPI reference</span>
            <span className="relative block">
              <Receipt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="field !pl-9 font-mono"
                required
                minLength={6}
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Bank UTR"
              />
            </span>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment proof</span>
            <span className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <FileUp className="h-4 w-4 text-slate-400" />
              <input
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-950 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
            </span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={busy || !file}>
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
      {latest?.proof_filename && (
        <ProofViewerModal
          open={proofOpen}
          token={token}
          requestId={latest.id}
          filename={latest.proof_filename}
          onClose={() => setProofOpen(false)}
        />
      )}
    </section>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-navy-950 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

