"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, XCircle } from "lucide-react";
import { api, apiForm, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import { type CollectionAccount } from "@/features/finance/CollectionAccounts";
import { financeStatusTone, formatFinanceKind, formatFinanceStatus, formatTransferMode, type FinanceRequest } from "@/features/finance/types";
import { ProofViewerModal } from "@/features/finance/ProofViewerModal";

export default function AuditorRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [row, setRow] = useState<FinanceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [modal, setModal] = useState<"receive" | "reject" | "transfer" | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [banks, setBanks] = useState<CollectionAccount[]>([]);
  const [transferBank, setTransferBank] = useState("");
  const [transferUtr, setTransferUtr] = useState("");
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [transferBusy, setTransferBusy] = useState(false);

  async function load() {
    const data = await api<FinanceRequest>(`/api/v1/finance/requests/${id}`, { token });
    setRow(data);
  }

  useEffect(() => {
    if (!token || !id) return;
    load().catch((e) => setError(formatApiError(e, "Failed to load request")));
  }, [token, id]);

  useEffect(() => {
    if (!token || modal !== "transfer") return;
    api<CollectionAccount[]>("/api/v1/finance/collection-accounts", { token })
      .then((data) => setBanks(Array.isArray(data) ? data : []))
      .catch(() => setBanks([]));
  }, [token, modal]);

  async function receive(e: FormEvent) {
    e.preventDefault();
    try {
      setRow(await api<FinanceRequest>(`/api/v1/finance/requests/${id}/receive`, {
        token, method: "POST", body: JSON.stringify({ notes }),
      }));
      setModal(null);
      setNotes("");
      flash.ok(row?.kind === "WALLET_TOPUP"
        ? "Payment received. Wallet has been credited."
        : row?.kind === "EARNINGS_WITHDRAW"
          ? "Withdrawal approved. The amount has been debited from the retailer wallet."
          : "Activation approved. The distributor or admin can now activate this retailer.");
    } catch (err) {
      flash.fail(err, "Could not mark received");
    }
  }

  function openTransfer() {
    setTransferBank("");
    setTransferUtr("");
    setTransferProof(null);
    setNotes("");
    setModal("transfer");
  }

  async function transfer(e: FormEvent) {
    e.preventDefault();
    if (!transferBank || transferUtr.trim().length < 6 || !transferProof) return;
    setTransferBusy(true);
    try {
      const form = new FormData();
      form.set("utr", transferUtr.trim());
      form.set("collectionAccountId", transferBank);
      form.set("proof", transferProof);
      if (notes.trim()) form.set("notes", notes.trim());
      setRow(await apiForm<FinanceRequest>(`/api/v1/finance/requests/${id}/transfer`, form, { token }));
      setModal(null);
      setNotes("");
      flash.ok("Withdrawal marked transferred. The retailer wallet has been debited.");
    } catch (err) {
      flash.fail(err, "Could not mark transferred");
    } finally {
      setTransferBusy(false);
    }
  }

  async function reject(e: FormEvent) {
    e.preventDefault();
    try {
      setRow(await api<FinanceRequest>(`/api/v1/finance/requests/${id}/reject`, {
        token, method: "POST", body: JSON.stringify({ notes }),
      }));
      setModal(null);
      setNotes("");
      flash.ok("Request rejected.");
    } catch (err) {
      flash.fail(err, "Could not reject request");
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!row) return <div className="card h-48 animate-pulse bg-slate-100" />;

  const selectedBank = banks.find((item) => item.id === transferBank);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/auditor/requests" className="inline-flex text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950">
        ← All requests
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">{formatFinanceKind(row.kind)}</span>
            <StatusPill value={financeStatusTone(row.kind, row.status)} label={formatFinanceStatus(row.kind, row.status)} />
          </div>
          <h1 className="font-display text-3xl font-bold">{row.retailer_name}</h1>
          <p className="text-sm text-slate-300">
            {row.retailer_code} · {maskMobile(row.retailer_mobile ?? "")} · {inr(row.amount)}
          </p>
          <p className="text-xs text-slate-400">
            Submitted {row.created_at ? when(row.created_at) : "—"} by {row.requested_by_name}
          </p>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Item
            label="UTR"
            value={row.kind === "EARNINGS_WITHDRAW" && row.status === "PENDING" ? "—" : row.utr}
            mono
          />
          {row.kind === "WALLET_TOPUP" && (
            <>
              <Item label="Mode" value={formatTransferMode(row.transfer_mode)} />
              <Item label="Paid to bank" value={row.collection_bank_name || "—"} />
              <Item label="Account name" value={row.collection_account_name || "—"} />
              <Item label="Account number" value={row.collection_account_number || "—"} mono />
              <Item label="IFSC" value={row.collection_ifsc || "—"} mono />
              {row.collection_upi && <Item label="UPI" value={row.collection_upi} mono />}
            </>
          )}
          {row.kind === "EARNINGS_WITHDRAW" && (
            <>
              <Item label="Pay to bank" value={row.payout_bank_name || "—"} />
              <Item label="Account name" value={row.payout_account_name || "—"} />
              <Item label="Account number" value={row.payout_account_number || "—"} mono />
              <Item label="IFSC" value={row.payout_ifsc || "—"} mono />
              {row.collection_bank_name && (
                <>
                  <Item label="Transferred from" value={row.collection_bank_name} />
                  <Item label="Source account" value={row.collection_account_name || "—"} />
                  <Item label="Source number" value={row.collection_account_number || "—"} mono />
                  <Item label="Source IFSC" value={row.collection_ifsc || "—"} mono />
                </>
              )}
            </>
          )}
          <Item label="Remarks" value={row.remarks?.trim() || "—"} />
          <Item label="Proof file" value={row.proof_filename ?? "—"} />
          <Item label="Distributor" value={row.distributor_name ?? "—"} />
          <Item label="Retailer status" value={row.retailer_status ?? "—"} />
          {row.auditor_name && <Item label="Reviewed by" value={row.auditor_name} />}
          {row.auditor_notes && <Item label="Notes" value={row.auditor_notes} />}
        </dl>
        <div className="flex flex-wrap gap-2 pt-2">
          {row.proof_filename && (
            <button type="button" className="btn-secondary" onClick={() => setProofOpen(true)}>
              View proof
            </button>
          )}
          {row.status === "PENDING" && row.kind === "EARNINGS_WITHDRAW" && (
            <>
              <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openTransfer}>
                <ShieldCheck className="h-4 w-4" /> Mark transferred
              </button>
              <button type="button" className="btn-secondary inline-flex items-center gap-2 text-rose-600" onClick={() => setModal("reject")}>
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </>
          )}
          {row.status === "PENDING" && row.kind !== "EARNINGS_WITHDRAW" && (
            <>
              <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setModal("receive")}>
                <ShieldCheck className="h-4 w-4" /> Mark received
              </button>
              <button type="button" className="btn-secondary inline-flex items-center gap-2 text-rose-600" onClick={() => setModal("reject")}>
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </>
          )}
        </div>
      </section>

      <FormModal
        open={modal === "receive"}
        title="Mark payment received"
        description={row.kind === "WALLET_TOPUP"
          ? "This credits the retailer wallet immediately."
          : "The retailer status becomes Approved. The distributor or admin can then activate the outlet."}
        onClose={() => setModal(null)}
        onSubmit={receive}
        submitLabel="Confirm received"
      >
        <TextField label="Notes (optional)" value={notes} onChange={setNotes} />
      </FormModal>
      <Modal
        open={modal === "transfer"}
        onClose={() => setModal(null)}
        title="Mark withdrawal transferred"
        description="Choose the bank you paid from, then enter the UTR and the payment proof."
      >
        <form onSubmit={transfer} className="space-y-4 pt-2">
          <Field label="Transferred from">
            <select
              required
              value={transferBank}
              onChange={(e) => setTransferBank(e.target.value)}
              className="field"
            >
              <option value="" disabled>Select bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name}
                </option>
              ))}
            </select>
          </Field>
          {!banks.length && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Add an active collection bank under Settings before marking this transferred.
            </p>
          )}
          {selectedBank && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-bold text-navy-950">{selectedBank.account_name}</p>
              <p className="font-mono text-navy-950">{selectedBank.account_number}</p>
              <p className="font-mono text-xs text-slate-600">IFSC {selectedBank.ifsc}</p>
            </div>
          )}
          <Field label="UTR / reference">
            <input
              type="text"
              required
              minLength={6}
              value={transferUtr}
              onChange={(e) => setTransferUtr(e.target.value)}
              placeholder="e.g. 423984729384"
              className="field font-mono"
            />
          </Field>
          <Field label="Payment proof">
            <input
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setTransferProof(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-navy-950 file:px-3.5 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
          </Field>
          <Field label="Notes (optional)">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button
              type="submit"
              disabled={transferBusy || !transferBank || transferUtr.trim().length < 6 || !transferProof}
              className="btn-primary"
            >
              {transferBusy ? "Submitting..." : "Confirm transferred"}
            </button>
          </div>
        </form>
      </Modal>
      <FormModal
        open={modal === "reject"}
        title="Reject payment"
        description="The requester can submit a new proof after rejection."
        onClose={() => setModal(null)}
        onSubmit={reject}
        submitLabel="Reject request"
      >
        <TextField label="Reason" required value={notes} onChange={setNotes} />
      </FormModal>
      <ProofViewerModal
        open={proofOpen}
        token={token}
        requestId={id}
        filename={row.proof_filename}
        onClose={() => setProofOpen(false)}
      />
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold text-navy-950 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
