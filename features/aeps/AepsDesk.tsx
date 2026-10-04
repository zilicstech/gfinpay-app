"use client";

import { FormEvent, useEffect, useState } from "react";
import { 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  IndianRupee, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  Smartphone, 
  Wallet, 
  Zap 
} from "lucide-react";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { api } from "@/lib/api-client";
import { Alert, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type AepsMode = "CW" | "BE" | "MS" | "AP";

type PopularBank = {
  iin: string;
  name: string;
  short: string;
};

const POPULAR_BANKS: PopularBank[] = [
  { iin: "607152", name: "State Bank of India", short: "SBI" },
  { iin: "508534", name: "Punjab National Bank", short: "PNB" },
  { iin: "508505", name: "Bank of Baroda", short: "BOB" },
  { iin: "607027", name: "HDFC Bank", short: "HDFC" },
  { iin: "508532", name: "ICICI Bank", short: "ICICI" },
  { iin: "607077", name: "Canara Bank", short: "Canara" },
  { iin: "607153", name: "Axis Bank", short: "Axis" },
  { iin: "508508", name: "Union Bank of India", short: "UBI" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 3000, 5000, 10000];

type AepsReceipt = {
  transactionId: string;
  mode: AepsMode;
  bankName: string;
  aadhaarLast4: string;
  amount: number;
  accountBalance?: number;
  rrn: string;
  stan: string;
  state: string;
  createdAt: string;
};

export function AepsDesk() {
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [mode, setMode] = useState<AepsMode>("CW");
  const [aadhaar, setAadhaar] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [mobile, setMobile] = useState("");
  const [selectedBank, setSelectedBank] = useState<PopularBank>(POPULAR_BANKS[0]);
  const [amount, setAmount] = useState("1000");

  // Biometric scanner state
  const [scannerReady, setScannerReady] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [biometricCaptured, setBiometricCaptured] = useState(false);
  const [scanQuality, setScanQuality] = useState<number | null>(null);

  // Submitting
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<AepsReceipt | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      api<{ availableBalance: number }>("/api/v1/wallet", { token })
        .then((res) => setWalletBalance(res.availableBalance))
        .catch(() => {});
    }
  }, [token, receipt]);

  function formatAadhaarInput(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 12);
    const parts = raw.match(/.{1,4}/g);
    return parts ? parts.join(" ") : raw;
  }

  function handleCaptureBiometric() {
    setScanning(true);
    setBiometricCaptured(false);
    flash.clear();

    // Simulate RD Service scanner handshake & fingerprint capture
    setTimeout(() => {
      setScanning(false);
      setBiometricCaptured(true);
      const quality = Math.floor(75 + Math.random() * 23);
      setScanQuality(quality);
      flash.ok(`Fingerprint scanned successfully (Quality: ${quality}%).`);
    }, 1800);
  }

  async function handleExecuteAeps(e: FormEvent) {
    e.preventDefault();
    const cleanAadhaar = aadhaar.replace(/\s/g, "");
    if (cleanAadhaar.length !== 12) {
      flash.fail(null, "Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!biometricCaptured) {
      flash.fail(null, "Please capture customer fingerprint on biometric scanner");
      return;
    }

    setProcessing(true);
    flash.clear();

    const numAmount = mode === "CW" || mode === "AP" ? Number(amount) : 0;

    // Simulate AePS Switch execution
    setTimeout(() => {
      const mockReceipt: AepsReceipt = {
        transactionId: "TXN" + Date.now(),
        mode,
        bankName: selectedBank.name,
        aadhaarLast4: cleanAadhaar.slice(-4),
        amount: numAmount,
        accountBalance: Math.floor(1500 + Math.random() * 25000),
        rrn: "RRN" + Math.floor(100000000000 + Math.random() * 900000000000),
        stan: String(Math.floor(100000 + Math.random() * 900000)),
        state: "SUCCESS",
        createdAt: new Date().toISOString(),
      };
      setReceipt(mockReceipt);
      setProcessing(false);
    }, 1500);
  }

  function resetTerminal() {
    setReceipt(null);
    setBiometricCaptured(false);
    setScanQuality(null);
    setAadhaar("");
    setMobile("");
    setAmount("1000");
  }

  const modeLabels: Record<AepsMode, { title: string; desc: string }> = {
    CW: { title: "Cash Withdrawal", desc: "Aadhaar authenticated cash dispensing" },
    BE: { title: "Balance Enquiry", desc: "Check live customer bank account balance" },
    MS: { title: "Mini Statement", desc: "Last 10 transactions of customer account" },
    AP: { title: "Aadhaar Pay", desc: "Direct merchant payment collection" },
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Fingerprint className="h-4 w-4" />
              Micro-ATM & Biometric Rail
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Aadhaar Enabled Payment System (AePS)
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Interoperable biometric banking. Withdraw cash, check account balances, and fetch mini-statements.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md min-w-[15rem]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                Wallet Float
              </span>
              <span className="font-semibold text-emerald-400">Instant Credit</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
              {walletBalance !== null ? inr(walletBalance) : "—"}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RD Service: Morpho Ready
            </div>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {receipt ? (
        /* Thermal Receipt View */
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-navy-950">
              {receipt.mode === "CW" ? "Withdrawal Authorized!" : "Enquiry Successful!"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">NPCI Interoperable AePS Switch Approved</p>
            {receipt.amount > 0 && (
              <p className="mt-4 font-display text-4xl font-extrabold text-emerald-600">{inr(receipt.amount)}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 divide-y divide-slate-200/60 max-w-md mx-auto text-sm">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-navy-950">{modeLabels[receipt.mode].title}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Bank</span>
              <span className="font-semibold text-navy-950">{receipt.bankName}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Aadhaar (Last 4)</span>
              <span className="font-mono text-navy-950">•••• •••• {receipt.aadhaarLast4}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Bank RRN</span>
              <span className="font-mono font-bold text-emerald-700">{receipt.rrn}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">STAN / Terminal</span>
              <span className="font-mono text-navy-950">{receipt.stan}</span>
            </div>
            {receipt.accountBalance !== undefined && (
              <div className="flex justify-between py-2.5 font-bold">
                <span className="text-slate-700">Account Balance</span>
                <span className="text-navy-950">{inr(receipt.accountBalance)}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Date</span>
              <span className="text-navy-950">{when(receipt.createdAt)}</span>
            </div>
          </div>

          {receipt.mode === "CW" && (
            <div className="max-w-md mx-auto rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Hand Over Cash:</span>
              <span className="font-display text-xl font-bold text-emerald-700">{inr(receipt.amount)}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Print AePS Slip
            </button>
            <button
              type="button"
              onClick={resetTerminal}
              className="btn-primary"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              New Transaction
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleExecuteAeps} className="space-y-6">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["CW", "BE", "MS", "AP"] as AepsMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <p className="font-bold text-sm text-navy-950">{modeLabels[m].title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{modeLabels[m].desc}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Customer Details</span>
                  <h3 className="text-lg font-bold text-navy-950">Aadhaar & Bank Selection</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    12-digit Aadhaar Number
                  </label>
                  <div className="relative">
                    <input
                      type={showAadhaar ? "text" : "password"}
                      maxLength={14}
                      required
                      value={aadhaar}
                      onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                      placeholder="XXXX XXXX XXXX"
                      className="field font-mono text-xl tracking-widest font-semibold !pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAadhaar((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAadhaar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Customer Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Customer mobile for SMS receipt"
                      className="field !pl-12 text-sm"
                    />
                  </div>
                </div>

                {/* Popular Bank Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Select Customer Bank
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {POPULAR_BANKS.map((b) => {
                      const isPicked = selectedBank.iin === b.iin;
                      return (
                        <button
                          key={b.iin}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`rounded-xl border p-2.5 text-center transition-all ${
                            isPicked
                              ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="block text-xs font-bold">{b.short}</span>
                          <span className="block text-[10px] text-slate-400 truncate mt-0.5">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount input if withdrawal */}
                {(mode === "CW" || mode === "AP") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Withdrawal Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min={100}
                        max={10000}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="1000"
                        className="field !pl-10 text-2xl font-bold text-navy-950 tracking-tight"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUICK_AMOUNTS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setAmount(String(q))}
                          className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors ${
                            Number(amount) === q
                              ? "bg-navy-950 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {inr(q)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Biometric Capture */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5 text-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Authentication</span>
                  <h3 className="text-lg font-bold text-navy-950">Biometric RD Service</h3>
                </div>

                {/* Biometric Scanner Visual Pod */}
                <div className={`mx-auto w-48 h-48 rounded-3xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-300 ${
                  biometricCaptured
                    ? "border-emerald-500 bg-emerald-50/70 shadow-lg shadow-emerald-500/20"
                    : scanning
                    ? "border-sky-500 bg-sky-50/70 animate-pulse shadow-lg shadow-sky-500/20"
                    : "border-dashed border-slate-300 bg-slate-50"
                }`}>
                  <Fingerprint className={`h-20 w-20 transition-colors ${
                    biometricCaptured
                      ? "text-emerald-600 scale-105"
                      : scanning
                      ? "text-sky-600 animate-bounce"
                      : "text-slate-400"
                  }`} />
                  <p className="mt-2 text-xs font-bold text-navy-950">
                    {biometricCaptured
                      ? `Captured (${scanQuality}%)`
                      : scanning
                      ? "Scanning Fingerprint..."
                      : "Ready to Scan"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {biometricCaptured ? "Biometric PID generated" : "Ask customer to place thumb"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureBiometric}
                  disabled={scanning}
                  className="btn-secondary w-full py-3"
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  {biometricCaptured ? "Re-scan Fingerprint" : "Capture Fingerprint"}
                </button>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={processing || !biometricCaptured || aadhaar.replace(/\s/g, "").length !== 12}
                    className="btn-primary w-full py-4 text-base justify-center shadow-lg shadow-emerald-600/20"
                  >
                    {processing ? (
                      "Executing Switch Handshake..."
                    ) : (
                      <>
                        Authorize & Submit
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
