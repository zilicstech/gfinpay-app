"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Copy, Printer, RefreshCw, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import type { TxnRow } from "@/features/admin/types";

export type TxnRecord = TxnRow & {
  partner_code?: string;
  agent_user_id?: string;
  updated_at?: string;
};

type CallbackDiagRow = {
  id: number;
  provider: string;
  event?: string | null;
  status?: string | null;
  merchant_code?: string | null;
  outcome?: string | null;
  created_at?: string | null;
};

type VerifyTransactionResponse = {
  transaction: TxnRecord;
  previousState: string;
  currentState: string;
  changed: boolean;
  verifiedAt: string;
  message: string;
  callbacks?: CallbackDiagRow[];
};

export function TransactionRecord({
  backHref,
  backLabel,
  txn,
  extraFacts,
  flash,
  verifyEndpoint,
  adminResolveEndpoint,
  isAdminView = false,
  onTransactionUpdated,
}: {
  backHref: string;
  backLabel: string;
  txn: TxnRecord;
  extraFacts?: { label: string; value: ReactNode }[];
  flash?: ReactNode;
  verifyEndpoint?: string;
  adminResolveEndpoint?: string;
  isAdminView?: boolean;
  onTransactionUpdated?: (next: TxnRecord) => void;
}) {
  const token = useSession((s) => s.token);
  const [copied, setCopied] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [callbacks, setCallbacks] = useState<CallbackDiagRow[] | null>(null);

  const [resolveMode, setResolveMode] = useState<"CONFIRM" | "REVERSE" | null>(null);
  const [resolveRef, setResolveRef] = useState(txn.partner_ref ?? "");
  const [resolveReason, setResolveReason] = useState("");
  const [resolving, setResolving] = useState(false);

  const effectiveResolveEndpoint =
    adminResolveEndpoint ?? (isAdminView ? `/api/v1/admin/transactions/${txn.id}/resolve` : undefined);
  const isNonTerminal = txn.state === "HOLD" || txn.state === "PENDING" || txn.state === "INITIATED";
  const totalAmount = Number(txn.amount || 0) + Number(txn.fee || 0);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleVerifyStatus() {
    if (!token || !verifyEndpoint) return;
    setVerifying(true);
    setVerifyMsg(null);
    setVerifyErr(null);
    try {
      const res = await api<VerifyTransactionResponse>(verifyEndpoint, {
        token,
        method: "POST",
        body: "{}",
      });
      setVerifyMsg(res.message);
      if (isAdminView && Array.isArray(res.callbacks)) {
        setCallbacks(res.callbacks);
      }
      if (res.transaction && onTransactionUpdated) {
        onTransactionUpdated(res.transaction);
      }
    } catch (err) {
      setVerifyErr(formatApiError(err, "Could not verify transaction status"));
    } finally {
      setVerifying(false);
    }
  }

  function openResolveModal(mode: "CONFIRM" | "REVERSE") {
    setVerifyErr(null);
    setVerifyMsg(null);
    setResolveMode(mode);
    setResolveRef(txn.partner_ref ?? "");
    setResolveReason(
      mode === "CONFIRM"
        ? "Confirmed settled via banking switch verification"
        : "Reversed to wallet by Admin — no response from upstream API",
    );
  }

  async function handleAdminResolve() {
    if (!token || !effectiveResolveEndpoint || !resolveMode) return;
    setResolving(true);
    setVerifyMsg(null);
    setVerifyErr(null);
    try {
      const res = await api<VerifyTransactionResponse>(effectiveResolveEndpoint, {
        token,
        method: "POST",
        body: JSON.stringify({
          action: resolveMode,
          partnerRef: resolveRef.trim() || undefined,
          reason: resolveReason.trim() || undefined,
        }),
      });
      setVerifyMsg(res.message);
      setResolveMode(null);
      if (isAdminView && Array.isArray(res.callbacks)) {
        setCallbacks(res.callbacks);
      }
      if (res.transaction && onTransactionUpdated) {
        onTransactionUpdated(res.transaction);
      }
    } catch (err) {
      setVerifyErr(formatApiError(err, "Could not manually resolve transaction"));
    } finally {
      setResolving(false);
    }
  }

  const isSuccess = txn.state === "SUCCESS" || txn.state === "COMPLETED";
  const isFailed = txn.state === "FAILED" || txn.state === "REJECTED" || txn.state === "REVERSED";
  const railLabel = isAdminView ? txn.partner_code ?? "GFINPAY Switch" : "GFINPAY Banking Switch";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {verifyEndpoint && (
            <button
              onClick={handleVerifyStatus}
              disabled={verifying}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-navy-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-navy-900 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${verifying ? "animate-spin" : ""}`} />
              {verifying ? "Verifying Status…" : "Verify Status"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Print Receipt
          </button>
        </div>
      </div>

      {flash}
      {verifyErr && <Alert tone="error">{verifyErr}</Alert>}
      {verifyMsg && <Alert tone="success">{verifyMsg}</Alert>}

      {/* Admin Manual Resolution Controls when Transaction is stuck in HOLD / PENDING / INITIATED */}
      {isAdminView && isNonTerminal && effectiveResolveEndpoint && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold text-navy-950">
                  Transaction on {txn.state} · Manual Admin Resolution
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  If <strong>Verify Status</strong> does not receive a final response from the upstream banking API, you can manually mark this transaction as confirmed (finalize wallet deduction of <strong>{inr(totalAmount)}</strong>) or reverse the held funds back into the retailer&apos;s wallet.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={resolving || verifying}
                onClick={() => openResolveModal("CONFIRM")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm &amp; Deduct Wallet
              </button>
              <button
                type="button"
                disabled={resolving || verifying}
                onClick={() => openResolveModal("REVERSE")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-60 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reverse to Wallet
              </button>
            </div>
          </div>

          {resolveMode && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  {resolveMode === "CONFIRM" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm Settlement &amp; Finalize Wallet Deduction ({inr(totalAmount)})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reverse Transaction &amp; Refund {inr(totalAmount)} to Retailer Wallet
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setResolveMode(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-navy-950"
                >
                  Cancel
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Bank RRN / UTR Reference <span className="text-slate-400 font-normal">(Optional)</span>
                  <input
                    className="field mt-1 font-mono text-xs"
                    value={resolveRef}
                    onChange={(e) => setResolveRef(e.target.value)}
                    placeholder="Enter bank UTR or reference number"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Admin Resolution Note / Reason <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1 text-xs"
                    value={resolveReason}
                    onChange={(e) => setResolveReason(e.target.value)}
                    placeholder={
                      resolveMode === "CONFIRM"
                        ? "Reason for confirming transaction"
                        : "Reason for reversing back to wallet"
                    }
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => setResolveMode(null)}
                  className="btn-secondary text-xs !py-2 !px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={handleAdminResolve}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-60 ${
                    resolveMode === "CONFIRM"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {resolving
                    ? "Processing…"
                    : resolveMode === "CONFIRM"
                      ? `Confirm SUCCESS & Deduct ${inr(totalAmount)}`
                      : `Confirm REVERSED & Refund ${inr(totalAmount)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Luxury Receipt Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 sm:px-10 sm:py-10 text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {txn.txn_type.replaceAll("_", " ")}
                </span>
                <StatusPill value={txn.state} />
              </div>
              <p className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {inr(txn.amount)}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>Fee: {inr(txn.fee)}</span>
                <span>•</span>
                <span>Created {when(txn.created_at)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md min-w-[14rem]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaction ID</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-emerald-300 font-semibold">{txn.id.slice(0, 16)}...</span>
                <button
                  type="button"
                  onClick={() => copy(txn.id, "txnId")}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Copy ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {copied === "txnId" && <p className="text-[10px] text-emerald-400 mt-1">Copied to clipboard!</p>}

              {txn.partner_ref && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bank Ref / UTR</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-white">{txn.partner_ref}</span>
                    <button
                      type="button"
                      onClick={() => copy(txn.partner_ref!, "partnerRef")}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy Reference"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {copied === "partnerRef" && <p className="text-[10px] text-emerald-400 mt-1">Copied!</p>}
                </div>
              )}
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  ✓
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Initiated</p>
                  <p className="text-[10px] text-slate-400 truncate">{when(txn.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    isSuccess
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isFailed
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-sky-500/20 text-sky-400"
                  }`}
                >
                  {isSuccess ? "✓" : isFailed ? "✕" : "•••"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Banking Switch</p>
                  <p className="text-[10px] text-slate-400 truncate">{railLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    isSuccess
                      ? "bg-emerald-400 text-black"
                      : isFailed
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isFailed ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Status</p>
                  <p className="text-[10px] text-slate-400 truncate">{txn.state}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {txn.failure_reason && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-4 sm:px-10 text-rose-900 text-sm flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold">Transaction Declined / Reversed</p>
              <p className="text-xs mt-0.5 text-rose-700">{txn.failure_reason}</p>
            </div>
          </div>
        )}

        {/* Detailed Facts Grid */}
        <div className="p-6 sm:p-10 space-y-6">
          <h3 className="font-display text-lg font-bold text-navy-950">Settlement Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Principal Amount</p>
              <p className="mt-1 font-display text-xl font-bold text-navy-950">{inr(txn.amount)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Fee</p>
              <p className="mt-1 font-display text-xl font-bold text-navy-950">{inr(txn.fee)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Settlement</p>
              <p className="mt-1 font-display text-xl font-bold text-emerald-700">
                {inr(Number(txn.amount) + Number(txn.fee || 0))}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Retailer / Counter</span>
              <span className="text-sm font-bold text-navy-950">{txn.agent_name ?? "Direct Outlet"}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-white">
              <span className="text-xs font-semibold text-slate-500">Transaction Reference</span>
              <span className="font-mono text-xs font-medium text-slate-800">{txn.id}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Rail Switch</span>
              <span className="text-sm font-medium text-navy-900">{railLabel}</span>
            </div>
            {txn.partner_ref && (
              <div className="flex items-center justify-between px-5 py-3.5 bg-white">
                <span className="text-xs font-semibold text-slate-500">Bank RRN / UTR</span>
                <span className="font-mono text-xs font-medium text-slate-800">{txn.partner_ref}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70">
              <span className="text-xs font-semibold text-slate-500">Timestamp</span>
              <span className="text-sm text-navy-900">
                {txn.created_at ? new Date(txn.created_at).toLocaleString("en-IN") : "—"}
              </span>
            </div>
            {extraFacts?.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between px-5 py-3.5 bg-white">
                <span className="text-xs font-semibold text-slate-500">{fact.label}</span>
                <span className="text-sm font-semibold text-navy-950">{fact.value}</span>
              </div>
            ))}
          </div>

          {/* Admin-only Callback Audit Trail */}
          {isAdminView && callbacks && callbacks.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matched Upstream Webhook Callbacks ({callbacks.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Provider</th>
                      <th className="px-4 py-2.5">Event / Status</th>
                      <th className="px-4 py-2.5">Outlet</th>
                      <th className="px-4 py-2.5">Outcome</th>
                      <th className="px-4 py-2.5">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {callbacks.map((cb) => (
                      <tr key={cb.id}>
                        <td className="px-4 py-2.5 font-mono font-bold text-navy-950">{cb.provider}</td>
                        <td className="px-4 py-2.5">
                          {cb.event || "—"} · <strong>{cb.status || "—"}</strong>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{cb.merchant_code || "—"}</td>
                        <td className="px-4 py-2.5">
                          <StatusPill value={cb.outcome || "RECEIVED"} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{when(cb.created_at || undefined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
