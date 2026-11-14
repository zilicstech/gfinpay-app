"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  HandCoins,
  IndianRupee,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { readLocation } from "@/features/ekyc/rd-service";

type CashoutSessionView = {
  id: string;
  transactionId?: string | null;
  amount: number;
  payableValue?: number;
  status: "INITIATED" | "QR_GENERATED" | "PAID" | "CASH_DISPENSED" | "FAILED" | "EXPIRED" | "REVERSED" | string;
  qrString?: string | null;
  displayExpirySec?: number;
  customerName?: string | null;
  customerMobile?: string | null;
  bankRrn?: string | null;
  utr?: string | null;
  errMsg?: string | null;
  payerName?: string | null;
  payerVpa?: string | null;
  refid?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  dispensedAt?: string | null;
  createdAt?: string | null;
};

const QUICK_AMOUNTS = [200, 500, 1000, 2000, 3000, 5000];

export function UpiCashoutDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const loadProfile = useSession((s) => s.loadProfile);

  const [amountInput, setAmountInput] = useState("500");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [activeSession, setActiveSession] = useState<CashoutSessionView | null>(null);
  const [history, setHistory] = useState<CashoutSessionView[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const rows = await api<CashoutSessionView[]>("/api/v1/cashout/upi/history", { token });
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      /* ignore background history error */
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadHistory();
    api<CashoutSessionView | { status: "NONE" }>("/api/v1/cashout/upi/latest", { token })
      .then((res) => {
        if ("id" in res && res.id && (res.status === "QR_GENERATED" || res.status === "PAID")) {
          setActiveSession(res);
        }
      })
      .catch(() => undefined);
  }, [token, loadHistory]);

  // Countdown timer for active QR
  useEffect(() => {
    if (!activeSession || activeSession.status !== "QR_GENERATED" || !activeSession.expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const expMs = new Date(activeSession.expiresAt).getTime();
    const tick = () => {
      const rem = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  // Auto-poll every 3.5s while QR is awaiting payment
  useEffect(() => {
    if (!token || !activeSession || activeSession.status !== "QR_GENERATED") return;
    const poll = window.setInterval(async () => {
      try {
        const next = await api<CashoutSessionView>(`/api/v1/cashout/upi/${activeSession.id}/refresh`, {
          token,
          method: "POST",
          body: "{}",
        });
        setActiveSession(next);
        if (next.status !== "QR_GENERATED") {
          loadHistory();
          if (next.status === "PAID") {
            loadProfile().catch(() => undefined);
          }
        }
      } catch {
        /* ignore transient poll error */
      }
    }, 3500);
    return () => window.clearInterval(poll);
  }, [token, activeSession, loadHistory, loadProfile]);

  async function handleGenerateQr(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    const amt = Number(amountInput);
    if (!Number.isInteger(amt) || amt < 200 || amt > 5000 || amt % 100 !== 0) {
      setError("Amount must be between ₹200 and ₹5,000 in multiples of ₹100.");
      return;
    }
    const cleanMob = customerMobile.replace(/\D/g, "");
    if (cleanMob.length !== 10) {
      setError("Enter a valid 10-digit customer mobile number.");
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
        /* backend falls back to verified shop coordinates when browser GPS is unavailable */
      }

      const created = await api<CashoutSessionView>("/api/v1/cashout/upi/generate-qr", {
        token,
        method: "POST",
        body: JSON.stringify({
          amount: amt,
          customerMobile: cleanMob,
          customerName: customerName.trim() || undefined,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setActiveSession(created);
      loadHistory();
    } catch (err) {
      setError(formatApiError(err, "Could not generate UPI Cashout QR code"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyStatus(sessionId: string) {
    if (!token) return;
    setRefreshing(true);
    setError(null);
    setOkMsg(null);
    try {
      const next = await api<CashoutSessionView>(`/api/v1/cashout/upi/${sessionId}/refresh`, {
        token,
        method: "POST",
        body: "{}",
      });
      if (activeSession?.id === sessionId) {
        setActiveSession(next);
      }
      loadHistory();
      if (next.status === "PAID" || next.status === "CASH_DISPENSED") {
        setOkMsg(`Payment confirmed! UTR: ${next.utr || next.bankRrn || "Confirmed"}.`);
        loadProfile().catch(() => undefined);
      } else if (next.status === "FAILED" || next.status === "EXPIRED") {
        setError(next.errMsg || `QR session is ${next.status.toLowerCase()}.`);
      } else {
        setOkMsg("Customer payment is still pending on the UPI switch.");
      }
    } catch (err) {
      setError(formatApiError(err, "Could not verify QR payment status"));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDispenseCash() {
    if (!token || !activeSession) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api<CashoutSessionView>(`/api/v1/cashout/upi/${activeSession.id}/dispense`, {
        token,
        method: "POST",
        body: "{}",
      });
      setActiveSession(next);
      setOkMsg("Cash handover recorded! Ready for your next customer.");
      loadHistory();
    } catch (err) {
      setError(formatApiError(err, "Could not mark cash dispensed"));
    } finally {
      setBusy(false);
    }
  }

  function startNewQr() {
    setActiveSession(null);
    setError(null);
    setOkMsg(null);
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-950">UPI to Cashout</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate a dynamic UPI ATM QR code. Your operating wallet is credited automatically once the customer pays.
          </p>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {okMsg && <Alert tone="success">{okMsg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Generate QR or Live Active QR Session */}
        <div className="lg:col-span-7">
          {!activeSession ? (
            <form
              onSubmit={handleGenerateQr}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-600" />
                    Generate Dynamic Cashout QR
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Limits: ₹200 to ₹5,000 in multiples of ₹100
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  Instant Wallet Credit
                </span>
              </div>

              {/* Quick Amount Chips */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Select Cashout Amount
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => {
                    const selected = Number(amountInput) === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountInput(String(amt))}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                          selected
                            ? "bg-navy-950 text-white shadow-xs"
                            : "border border-slate-200 bg-slate-50 text-navy-950 hover:border-slate-300"
                        }`}
                      >
                        {inr(amt)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Amount (₹ · Multiple of 100) <span className="text-rose-600">*</span>
                  <div className="relative mt-1">
                    <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      className="field !pl-9 font-mono text-base font-bold"
                      inputMode="numeric"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="500"
                      required
                    />
                  </div>
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Customer Mobile Number <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1 font-mono"
                    inputMode="numeric"
                    maxLength={10}
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
                  <input
                    className="field mt-1"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                  />
                </label>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-xs text-slate-600 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Hand over physical cash <strong>only after</strong> the screen turns green and confirms UTR payment.
                </span>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 text-sm"
              >
                <QrCode className="h-4 w-4" />
                {busy ? "Generating Dynamic QR…" : `Generate ${inr(Number(amountInput || 0))} Cashout QR`}
              </button>
            </form>
          ) : (
            /* Active Session Card */
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs text-slate-500 block">Ref: {activeSession.refid || activeSession.id.slice(0, 8)}</span>
                  <h3 className="font-display text-2xl font-bold text-navy-950 mt-0.5">
                    {inr(activeSession.amount)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={activeSession.status} />
                  {activeSession.status === "QR_GENERATED" && secondsLeft !== null && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-bold ${
                        secondsLeft <= 20 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {secondsLeft}s
                    </span>
                  )}
                </div>
              </div>

              {activeSession.status === "QR_GENERATED" && activeSession.qrString && secondsLeft !== 0 && (
                <div className="flex flex-col items-center text-center space-y-4 py-2">
                  <div className="rounded-3xl border-2 border-navy-950 bg-white p-4 shadow-md">
                    <QRCodeSVG value={activeSession.qrString} size={220} level="M" includeMargin />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-navy-950">
                      Ask Customer to Scan with Any UPI App
                    </p>
                    <p className="text-xs text-slate-500">
                      GPay · PhonePe · Paytm · BHIM · Any Bank UPI App
                    </p>
                  </div>
                </div>
              )}

              {(activeSession.status === "PAID" || activeSession.status === "CASH_DISPENSED") && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-emerald-950">
                        Payment Confirmed · Wallet Credited!
                      </p>
                      <p className="text-xs text-emerald-800">
                        UTR / Bank RRN: <strong className="font-mono">{activeSession.utr || activeSession.bankRrn || "Confirmed"}</strong>
                      </p>
                    </div>
                  </div>
                  {(activeSession.payerName || activeSession.payerVpa) && (
                    <p className="text-xs text-emerald-900 border-t border-emerald-200/80 pt-2">
                      Paid by: <strong>{activeSession.payerName || "Customer"}</strong>
                      {activeSession.payerVpa ? ` (${activeSession.payerVpa})` : ""}
                    </p>
                  )}
                </div>
              )}

              {(activeSession.status === "FAILED" ||
                activeSession.status === "EXPIRED" ||
                (activeSession.status === "QR_GENERATED" && secondsLeft === 0)) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-xs text-rose-900">
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">QR Code Expired or Unpaid</p>
                    <p className="mt-0.5 text-rose-700">
                      {activeSession.errMsg || "Do not hand over cash. Generate a fresh QR code if the customer wants to try again."}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {activeSession.status === "QR_GENERATED" && (
                    <button
                      type="button"
                      disabled={refreshing}
                      onClick={() => handleVerifyStatus(activeSession.id)}
                      className="btn-secondary text-xs inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      {refreshing ? "Checking…" : "Verify Payment Status"}
                    </button>
                  )}
                  {activeSession.transactionId && (
                    <Link
                      href={`/agent/transactions/${activeSession.transactionId}`}
                      className="btn-secondary text-xs inline-flex items-center gap-1.5"
                    >
                      Receipt
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeSession.status === "PAID" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleDispenseCash}
                      className="btn-primary text-xs inline-flex items-center gap-1.5"
                    >
                      <HandCoins className="h-4 w-4" />
                      {busy ? "Recording…" : `Confirm ${inr(activeSession.amount)} Cash Handed Over`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startNewQr}
                    className="btn-secondary text-xs inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    New QR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Counter Safety & Recent Cashout Sessions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-navy-950 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Recent UPI Cashout Sessions
              </h3>
              <button
                type="button"
                onClick={loadHistory}
                className="text-xs font-semibold text-slate-500 hover:text-navy-950 inline-flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No UPI Cashout QR codes generated yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {history.slice(0, 10).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950">{inr(item.amount)}</span>
                        <StatusPill value={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.customerMobile || "Customer"} · {when(item.createdAt || undefined)}
                      </p>
                      {item.utr && (
                        <p className="font-mono text-[10px] text-emerald-700 mt-0.5">UTR: {item.utr}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === "QR_GENERATED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSession(item);
                            handleVerifyStatus(item.id);
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy-950 hover:bg-slate-50"
                        >
                          Verify
                        </button>
                      )}
                      {item.transactionId && (
                        <Link
                          href={`/agent/transactions/${item.transactionId}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-navy-950"
                        >
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
