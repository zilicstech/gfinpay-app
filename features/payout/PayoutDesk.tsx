"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Landmark,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { useDeskServices } from "@/features/desk/DeskServices";
import { readLocation } from "@/features/ekyc/rd-service";

type SettlementBankSummary = {
  id: string;
  accountHolderName: string;
  accountNumberMasked: string;
  ifsc: string;
  bankName: string;
  accountType?: string;
  verificationStatus?: string;
};

type PayoutEligibility = {
  eligible: boolean;
  biometricVerified: boolean;
  bankSynced: boolean;
  minCashoutRequired: number;
  completedCashoutCount: number;
  remainingCashoutCount: number;
  recent7DayCashoutCount: number;
  availableBalance: number;
  holdBalance: number;
  minAmount: number;
  maxAmount: number;
  settlementBank: SettlementBankSummary | null;
  reasons: string[];
};

type PayoutTransferView = {
  id: string;
  transactionId?: string | null;
  transferMode: "IMPS" | "NEFT" | "RTGS" | string;
  amount: number;
  fee: number;
  accountHolderName: string;
  accountNumberMasked: string;
  ifsc: string;
  bankName: string;
  utr?: string | null;
  reference: string;
  remarks?: string | null;
  status: string;
  message?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type VerifyStatusRes = {
  currentState: string;
  changed: boolean;
  message: string;
};

export function PayoutDesk() {
  const token = useSession((s) => s.token);
  const loadProfile = useSession((s) => s.loadProfile);
  const { codes, refreshCashActivation } = useDeskServices();

  const [eligibility, setEligibility] = useState<PayoutEligibility | null>(null);
  const [history, setHistory] = useState<PayoutTransferView[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [transferMode, setTransferMode] = useState<"IMPS" | "NEFT" | "RTGS">("IMPS");
  const [remarks, setRemarks] = useState("Merchant bank settlement");

  const [busy, setBusy] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await refreshCashActivation(true).catch(() => null);
      const [elig, hist] = await Promise.all([
        api<PayoutEligibility>("/api/v1/payouts/eligibility", { token }),
        api<PayoutTransferView[]>("/api/v1/payouts/history", { token }).catch(() => []),
      ]);
      setEligibility(elig);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (e) {
      setError(formatApiError(e, "Could not load payout eligibility"));
    } finally {
      setLoading(false);
    }
  }, [token, refreshCashActivation]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !eligibility) return;

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid payout settlement amount.");
      return;
    }

    setBusy(true);
    setError(null);
    setOkMsg(null);
    try {
      let coords: { latitude?: string; longitude?: string } = {};
      try {
        coords = await readLocation();
      } catch {
        /* falls back to stored shop GPS on server */
      }

      const created = await api<PayoutTransferView>("/api/v1/payouts", {
        token,
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({
          amount: num,
          transferMode,
          remarks: remarks.trim() || "Merchant bank settlement",
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      setAmount("");
      setOkMsg(
        created.status === "SUCCESS"
          ? `Settlement payout of ${inr(created.amount)} succeeded! UTR: ${created.utr || created.reference}.`
          : `Settlement payout of ${inr(created.amount)} initiated (${created.status}). Ref: ${created.reference}.`,
      );
      await loadAll();
      loadProfile().catch(() => undefined);
    } catch (err) {
      setError(formatApiError(err, "Payout transfer could not be initiated"));
      await loadAll().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyTxn(txnId: string) {
    if (!token) return;
    setVerifyingId(txnId);
    setError(null);
    setOkMsg(null);
    try {
      const res = await api<VerifyStatusRes>(`/api/v1/desk/transactions/${txnId}/verify-status`, {
        token,
        method: "POST",
        body: "{}",
      });
      setOkMsg(res.message);
      await loadAll();
      if (res.changed) {
        loadProfile().catch(() => undefined);
      }
    } catch (err) {
      setError(formatApiError(err, "Could not verify payout status"));
    } finally {
      setVerifyingId(null);
    }
  }

  if (loading && !eligibility) {
    return <div className="card h-64 animate-pulse bg-[#f5f5f5]" />;
  }
  if (!eligibility) {
    return error ? <Alert tone="error">{error}</Alert> : null;
  }

  const progressPct = Math.min(
    100,
    Math.round((eligibility.completedCashoutCount / Math.max(1, eligibility.minCashoutRequired)) * 100),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">
            Bank Settlement Payout
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Withdraw your operating wallet balance directly to your primary settlement bank account via IMPS, NEFT, or RTGS.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadAll}
          className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Eligibility
        </button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {okMsg && <Alert tone="success">{okMsg}</Alert>}

      {/* Eligibility & Wallet Summary Strip */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Available Wallet Balance */}
        <div className="rounded-3xl border border-slate-200 bg-navy-950 p-5 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Available for Settlement</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-display text-3xl font-bold text-white">{inr(eligibility.availableBalance)}</p>
          {Number(eligibility.holdBalance) > 0 && (
            <p className="text-xs text-amber-300">In-flight hold: {inr(eligibility.holdBalance)}</p>
          )}
        </div>

        {/* 2. Minimum 7 Cashout Transactions Progress */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">Cashout Activity Gate</span>
            <span
              className={`font-mono font-bold ${
                eligibility.completedCashoutCount >= eligibility.minCashoutRequired
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {eligibility.completedCashoutCount} / {eligibility.minCashoutRequired} Completed
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                progressPct >= 100 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {eligibility.remainingCashoutCount > 0
              ? `Complete ${eligibility.remainingCashoutCount} more UPI/AePS cashout transaction${
                  eligibility.remainingCashoutCount === 1 ? "" : "s"
                } to unlock payouts.`
              : eligibility.recent7DayCashoutCount > 0
                ? `${eligibility.recent7DayCashoutCount} cashout(s) in last 7 days · Active`
                : "Complete 1 cashout within the last 7 days to settle."}
          </p>
        </div>

        {/* 3. Primary Settlement Bank */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">Settlement Bank</span>
            <Landmark className="h-4 w-4 text-emerald-600" />
          </div>
          {eligibility.settlementBank ? (
            <>
              <p className="font-bold text-navy-950 truncate">{eligibility.settlementBank.bankName}</p>
              <p className="font-mono text-xs text-slate-600">
                {eligibility.settlementBank.accountNumberMasked} · {eligibility.settlementBank.ifsc}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                {eligibility.bankSynced ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Ready for Settlement
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Switch Sync
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-slate-500">No active settlement bank added yet.</p>
              <Link href="/agent/profile?tab=banks" className="text-xs font-bold text-emerald-700 underline">
                Add Bank Account →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Unlock Checklist when Not Eligible */}
      {!eligibility.eligible && eligibility.reasons.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            Complete These Steps to Unlock Bank Settlement Payouts
          </div>
          <ul className="space-y-1.5 text-xs text-amber-900 list-disc pl-5">
            {eligibility.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            {!eligibility.biometricVerified && (
              <Link
                href={codes.has("UPI_CASHOUT") ? "/agent/cash" : "/agent/aeps"}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                Complete Biometric Activation
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {eligibility.remainingCashoutCount > 0 && eligibility.biometricVerified && (
              <>
                {codes.has("UPI_CASHOUT") && (
                  <Link href="/agent/cash" className="btn-primary text-xs inline-flex items-center gap-1.5">
                    Open UPI Cashpoint
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {codes.has("AEPS") && (
                  <Link href="/agent/aeps" className="btn-secondary text-xs inline-flex items-center gap-1.5">
                    Open AePS Counter
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </>
            )}
            {!eligibility.settlementBank && (
              <Link href="/agent/profile?tab=banks" className="btn-secondary text-xs inline-flex items-center gap-1.5">
                Verify Bank in My Profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Initiate Payout Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-navy-950">Initiate Bank Transfer</h2>
            <span className="text-xs text-slate-500">
              {inr(eligibility.minAmount)} – {inr(eligibility.maxAmount)}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Transfer Mode</span>
            <div className="grid grid-cols-3 gap-2">
              {(["IMPS", "NEFT", "RTGS"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTransferMode(m)}
                  className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                    transferMode === m
                      ? "bg-navy-950 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Settlement Amount (₹) <span className="text-rose-600">*</span>
            <div className="relative mt-1">
              <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="field !pl-9 font-mono text-base font-bold"
                inputMode="decimal"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!eligibility.eligible || busy}
                required
              />
            </div>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Narration / Remarks
            <input
              className="field mt-1"
              maxLength={80}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!eligibility.eligible || busy}
            />
          </label>

          <button
            type="submit"
            disabled={!eligibility.eligible || busy || !amount.trim()}
            className="btn-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            {busy ? "Processing Payout…" : "Transfer to Settlement Bank"}
          </button>
        </form>

        {/* Right: Recent Payout Transfers & Manual Status Verification */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-navy-950">Recent Settlement Payouts</h3>
            <span className="text-xs text-slate-400">{history.length} records</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No bank settlement payouts initiated yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {history.map((p) => {
                const isVerifying = verifyingId === p.transactionId;
                return (
                  <div key={p.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950 text-sm">{inr(p.amount)}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {p.transferMode}
                        </span>
                        <StatusPill value={p.status} />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {p.bankName} ({p.accountNumberMasked}) · {when(p.createdAt || undefined)}
                      </p>
                      {p.utr && (
                        <p className="font-mono text-[11px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          UTR: {p.utr}
                        </p>
                      )}
                      {p.message && p.status === "FAILED" && (
                        <p className="text-[11px] text-rose-700">{p.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.transactionId && (
                        <>
                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => handleVerifyTxn(p.transactionId!)}
                            className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-navy-950 hover:bg-slate-50 inline-flex items-center gap-1"
                          >
                            <RefreshCw className={`h-3 w-3 ${isVerifying ? "animate-spin" : ""}`} />
                            {isVerifying ? "Checking…" : "Verify Status"}
                          </button>
                          <Link
                            href={`/agent/transactions/${p.transactionId}`}
                            className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-navy-950 inline-flex items-center gap-1"
                          >
                            Receipt
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
