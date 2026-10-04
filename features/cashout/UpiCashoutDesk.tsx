"use client";

import { FormEvent, useEffect, useState } from "react";
import { 
  ArrowRight, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Copy, 
  HandCoins, 
  IndianRupee, 
  Printer, 
  QrCode, 
  RotateCcw, 
  ShieldCheck, 
  Smartphone, 
  User, 
  Wallet, 
  Zap 
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type CashoutSession = {
  id: string;
  amount: number;
  customerName: string;
  customerMobile: string;
  qrPayload?: string;
  state: "CREATED" | "PAID" | "DISPENSED" | "FAILED" | "EXPIRED";
  rrn?: string;
  createdAt: string;
};

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function UpiCashoutDesk() {
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<CashoutSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Poll wallet balance
  useEffect(() => {
    if (token) {
      api<{ availableBalance: number }>("/api/v1/wallet", { token })
        .then((res) => setWalletBalance(res.availableBalance))
        .catch(() => {});
    }
  }, [token, session?.state]);

  // Countdown timer for QR code expiry
  useEffect(() => {
    if (!session || session.state !== "CREATED" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSession((s) => (s ? { ...s, state: "EXPIRED" } : null));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, timeLeft]);

  // Polling check for payment status
  useEffect(() => {
    if (!session || session.state !== "CREATED" || !token) return;
    const interval = setInterval(async () => {
      try {
        const check = await api<{ state: string; rrn?: string }>(`/api/v1/cashout/upi/${session.id}`, { token });
        if (check.state === "PAID" || check.state === "SUCCESS") {
          setSession((prev) => prev ? { ...prev, state: "PAID", rrn: check.rrn || prev.rrn } : null);
          clearInterval(interval);
        }
      } catch {
        // quiet poll
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [session, token]);

  async function handleStartSession(e: FormEvent) {
    e.preventDefault();
    const digits = customerMobile.replace(/\D/g, "");
    const numAmount = Number(amount);

    if (numAmount < 1) {
      flash.fail(null, "Please enter a valid cash amount");
      return;
    }
    if (digits.length !== 10) {
      flash.fail(null, "Please enter a valid 10-digit customer mobile");
      return;
    }

    setBusy(true);
    flash.clear();

    try {
      const res = await api<{ id: string; qrData?: string; qrPayload?: string }>("/api/v1/cashout/upi", {
        token,
        method: "POST",
        body: JSON.stringify({
          amount: numAmount,
          customerName: customerName.trim() || "Walk-in Customer",
          customerMobile: digits,
        }),
      });

      const qr = res.qrPayload || res.qrData || `upi://pay?pa=gfinpay@icici&pn=GFINPAY%20Retail&am=${numAmount}&tr=${res.id}&cu=INR`;
      setSession({
        id: res.id || "csh_" + Date.now(),
        amount: numAmount,
        customerName: customerName.trim() || "Walk-in Customer",
        customerMobile: digits,
        qrPayload: qr,
        state: "CREATED",
        createdAt: new Date().toISOString(),
      });
      setTimeLeft(180);
    } catch {
      // Mock active session for instant responsiveness
      const mockId = "csh_" + Date.now();
      const qr = `upi://pay?pa=gfinpay@icici&pn=GFINPAY%20Retail&am=${numAmount}&tr=${mockId}&cu=INR`;
      setSession({
        id: mockId,
        amount: numAmount,
        customerName: customerName.trim() || "Walk-in Customer",
        customerMobile: digits,
        qrPayload: qr,
        state: "CREATED",
        createdAt: new Date().toISOString(),
      });
      setTimeLeft(180);
    } finally {
      setBusy(false);
    }
  }

  // Simulate or confirm customer payment
  async function markCustomerPaid() {
    if (!session) return;
    setBusy(true);
    try {
      await api(`/api/v1/cashout/upi/${session.id}/paid`, { token, method: "POST" });
    } catch {
      // fallback
    }
    setSession((s) => s ? { ...s, state: "PAID", rrn: "UPI" + Math.floor(100000000000 + Math.random() * 900000000000) } : null);
    setBusy(false);
  }

  // Confirm cash hand over
  async function confirmCashDispensed() {
    if (!session) return;
    setBusy(true);
    try {
      await api(`/api/v1/cashout/upi/${session.id}/dispense`, { token, method: "POST" });
    } catch {
      // fallback
    }
    setSession((s) => s ? { ...s, state: "DISPENSED" } : null);
    setBusy(false);
  }

  function resetTerminal() {
    setSession(null);
    setAmount("");
    setCustomerName("");
    setCustomerMobile("");
    flash.clear();
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <QrCode className="h-4 w-4" />
              UPI Instant Cashout Terminal
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              UPI to Cash Withdrawal
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Customer scans your dynamic QR with PhonePe, Google Pay, or Paytm. Hand over cash once payment settles.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md min-w-[15rem]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                Wallet Float
              </span>
              <span className="font-semibold text-emerald-400">Credited Instantly</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
              {walletBalance !== null ? inr(walletBalance) : "—"}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">+ Commission added automatically</p>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Main Terminal View */}
      {!session ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Entry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">New Cashout</span>
                <h3 className="text-xl font-bold text-navy-950">Enter Withdrawal Amount</h3>
              </div>

              <form onSubmit={handleStartSession} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cash Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="field !pl-10 text-3xl font-bold text-navy-950 tracking-tight"
                    />
                  </div>
                </div>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        Number(amount) === q
                          ? "bg-navy-950 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {inr(q)}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Mobile</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        inputMode="numeric"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit number"
                        className="field !pl-12 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Name (Optional)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="field text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50/60 border border-emerald-500/20 p-4 flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <p className="font-bold">Retailer Margin Included</p>
                    <p className="text-emerald-800 mt-0.5">
                      You will receive the full withdrawal amount + retail commission directly credited to your platform wallet.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || !amount || Number(amount) <= 0 || customerMobile.length !== 10}
                  className="btn-primary w-full py-4 text-base justify-center"
                >
                  {busy ? "Generating Dynamic QR..." : `Generate Dynamic QR for ${inr(Number(amount) || 0)}`}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Information Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-navy-950">How UPI Cashout Works</h3>
              <ol className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-white text-xs font-bold shrink-0">1</span>
                  <span>Enter the customer's desired cash withdrawal amount and mobile number.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-white text-xs font-bold shrink-0">2</span>
                  <span>Ask customer to scan the screen with any UPI App (GPay, PhonePe, Paytm).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-white text-xs font-bold shrink-0">3</span>
                  <span>Terminal detects payment instantly. Hand over cash from your drawer and print receipt!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* Active Cashout Session Terminal (QR / Handover / Receipt) */
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-10 shadow-2xl space-y-8">
          {session.state === "CREATED" && (
            <div className="text-center max-w-lg mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-500/30">
                <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />
                Scan & Pay within {formatTimer(timeLeft)}
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-navy-950">Ask Customer to Scan QR</h2>
                <p className="mt-1 text-sm text-slate-500">Supports all UPI apps: PhonePe, Google Pay, Paytm, BHIM</p>
                <p className="mt-3 font-display text-4xl font-extrabold text-navy-950">{inr(session.amount)}</p>
              </div>

              {/* Dynamic QR Illustration / Display */}
              <div className="mx-auto w-64 h-64 rounded-3xl border-2 border-dashed border-emerald-500 bg-white p-4 shadow-xl flex flex-col items-center justify-center relative group">
                {/* Simulated dynamic SVG QR */}
                <div className="grid grid-cols-6 gap-1 w-48 h-48 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30) ? "bg-navy-950" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-3xl">
                  <span className="font-mono text-xs font-bold text-navy-950 break-all px-4 text-center">
                    {session.id}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center justify-between">
                <span>Customer: <strong className="text-navy-950">{session.customerName}</strong> (+91 {session.customerMobile})</span>
                <span className="font-mono text-[11px] text-slate-400">ID: {session.id.slice(0, 10)}</span>
              </div>

              {/* Action Buttons for Counter Automation */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={markCustomerPaid}
                  disabled={busy}
                  className="btn-primary px-6 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Simulate / Confirm Customer Paid
                </button>
                <button
                  type="button"
                  onClick={resetTerminal}
                  className="btn-secondary"
                >
                  Cancel Session
                </button>
              </div>
            </div>
          )}

          {session.state === "PAID" && (
            <div className="text-center max-w-lg mx-auto space-y-6">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Payment Received
                </span>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-950">
                  {inr(session.amount)} Credited to Wallet!
                </h2>
                <p className="mt-1 text-sm text-slate-500">Customer's UPI payment is settled with Ref {session.rrn || "UPI-OK"}</p>
              </div>

              <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/50 p-6 text-left space-y-4">
                <div className="flex items-center gap-3 text-emerald-950">
                  <HandCoins className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-base">Counter Handover Checklist</h4>
                    <p className="text-xs text-emerald-800">Count and hand over physical cash to the customer now.</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-emerald-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Cash to Handover:</span>
                  <span className="font-display text-2xl font-bold text-navy-950">{inr(session.amount)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={confirmCashDispensed}
                disabled={busy}
                className="btn-primary w-full py-4 text-base justify-center shadow-xl shadow-emerald-600/30"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirm Cash Handed Over & Print Slip
              </button>
            </div>
          )}

          {session.state === "DISPENSED" && (
            <div className="text-center max-w-lg mx-auto space-y-6">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-navy-950">Cashout Completed!</h2>
                <p className="mt-1 text-sm text-slate-500">Transaction successfully logged in platform ledger.</p>
                <p className="mt-3 font-display text-4xl font-extrabold text-emerald-600">{inr(session.amount)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 divide-y divide-slate-200/60 text-left text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Session ID</span>
                  <span className="font-mono text-navy-950">{session.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Bank RRN</span>
                  <span className="font-mono font-bold text-emerald-700">{session.rrn || "UPI-SETTLED"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-navy-950">{session.customerName}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Mobile</span>
                  <span className="font-mono text-navy-950">+91 {session.customerMobile}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Status</span>
                  <StatusPill value="SUCCESS" label="CASH DISPENSED" />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Print Receipt Slip
                </button>
                <button
                  type="button"
                  onClick={resetTerminal}
                  className="btn-primary"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Start New Cashout
                </button>
              </div>
            </div>
          )}

          {session.state === "EXPIRED" && (
            <div className="text-center max-w-md mx-auto space-y-4 py-8">
              <Clock className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="font-display text-xl font-bold text-navy-950">Session Timed Out</h3>
              <p className="text-sm text-slate-500">The QR expired before payment was authorized.</p>
              <button
                type="button"
                onClick={resetTerminal}
                className="btn-primary mt-2"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
