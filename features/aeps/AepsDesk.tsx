"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Fingerprint,
  IndianRupee,
  KeyRound,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Usb,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Modal, StatusPill } from "@/components/ui/primitives";
import { capture, deviceInfo, discover, readLocation } from "@/features/ekyc/rd-service";

type AepsMode = "CW" | "BE" | "MS";

type BankOption = {
  bankId?: string;
  iin: string;
  name: string;
  cwOtpMin?: number;
  failureRatePct?: number | null;
};

type AepsStatusView = {
  aepsReady: boolean;
  loggedInToday: boolean;
  loginRequired: boolean;
  dormantOutlet?: boolean;
  isTxnBioLoginRequired?: boolean;
  aadhaarMasked?: string | null;
  lastLoggedInAt?: string | null;
  cwWindowRemainingSec?: number;
  rdEnv?: string;
  limits?: {
    min: number;
    max: number;
    step: number;
    cwOtpThreshold?: number;
  };
  geofenceEnabled?: boolean;
  geofenceMaxKm?: number;
};

type AepsOtpSession = {
  otpSessionId: string;
  otpRequired: boolean;
  validity?: string | null;
  expiresAt?: string | null;
  message?: string | null;
  forAadhaar: string;
  forBankIin: string;
  forAmount: number;
};

type AepsTxnView = {
  id: string;
  transactionId?: string | null;
  aepsType: "CASH_WITHDRAWAL" | "BALANCE_ENQUIRY" | "MINI_STATEMENT" | "CASH_DEPOSIT" | string;
  bankIin: string;
  bankName: string;
  customerMobile: string;
  aadhaarMasked: string;
  maskedAccountNumber?: string | null;
  amount: number;
  bankRrn?: string | null;
  availableBalance?: number | null;
  isOnus?: boolean | null;
  miniStatement?: Array<Record<string, unknown>> | null;
  status: string;
  message?: string | null;
  reference: string;
  createdAt?: string | null;
};

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 3000, 5000, 10000];

export function AepsDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const loadProfile = useSession((s) => s.loadProfile);

  const [aepsStatus, setAepsStatus] = useState<AepsStatusView | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const [mode, setMode] = useState<AepsMode>("CW");
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBankKey, setSelectedBankKey] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [amount, setAmount] = useState("1000");
  const [consent, setConsent] = useState(true);

  const [otpSession, setOtpSession] = useState<AepsOtpSession | null>(null);
  const [customerOtp, setCustomerOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  const [history, setHistory] = useState<AepsTxnView[]>([]);
  const [receipt, setReceipt] = useState<AepsTxnView | null>(null);
  const [refreshingTxnId, setRefreshingTxnId] = useState<string | null>(null);
  const [scanStage, setScanStage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerNote, setScannerNote] = useState<string | null>(null);

  const loadStatus = useCallback(
    async (refresh = false) => {
      if (!token) return;
      setStatusLoading(true);
      try {
        const res = await api<AepsStatusView>(`/api/v1/aeps/status?refresh=${refresh ? "true" : "false"}`, {
          token,
        });
        setAepsStatus(res);
      } catch (err) {
        setError(formatApiError(err, "Could not load AePS terminal status"));
      } finally {
        setStatusLoading(false);
      }
    },
    [token],
  );

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const rows = await api<AepsTxnView[]>("/api/v1/aeps/history", { token });
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      /* non-blocking */
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadStatus(false);
    api<BankOption[]>("/api/v1/aeps/banks", { token })
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBanks(list);
          const first = list[0];
          setSelectedBankKey((prev) => prev || `${first.bankId || "0"}:${first.iin}`);
        }
      })
      .catch(() => undefined);
    loadHistory();
  }, [token, loadStatus, loadHistory]);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.iin.includes(q),
    );
  }, [banks, bankSearch]);

  const selectedBank = useMemo(() => {
    if (!banks.length) return null;
    const exact = banks.find((b, idx) => `${b.bankId || idx}:${b.iin}` === selectedBankKey);
    return exact ?? banks[0];
  }, [banks, selectedBankKey]);

  const bankIin = selectedBank?.iin ?? "607094";
  const rdEnv = aepsStatus?.rdEnv || "P";
  const minAmt = aepsStatus?.limits?.min ?? 100;
  const maxAmt = aepsStatus?.limits?.max ?? 10000;
  const stepAmt = aepsStatus?.limits?.step ?? 50;
  const cwOtpThreshold = selectedBank?.cwOtpMin ? Math.floor(Number(selectedBank.cwOtpMin)) : 5000;
  const numericAmount = mode === "CW" ? Number(amount || 0) : 0;
  const requiresOtpFlow = mode === "CW" && numericAmount > cwOtpThreshold;

  const cleanAadhaar = aadhaar.replace(/\D/g, "");
  const cleanMob = customerMobile.replace(/\D/g, "");

  const activeOtpSession =
    otpSession &&
    otpSession.forAadhaar === cleanAadhaar &&
    otpSession.forBankIin === bankIin &&
    otpSession.forAmount === numericAmount
      ? otpSession
      : null;

  async function handleCheckScanner() {
    setError(null);
    setScannerNote(null);
    try {
      const svc = await discover();
      const info = await deviceInfo(svc);
      setScannerNote(
        `Scanner ready: ${info.model || info.rdsId || "L1 RD Service"} (Port ${info.port}${info.serial ? ` · SN ${info.serial}` : ""})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not detect L1 fingerprint scanner.");
    }
  }

  async function handleMerchant2faLogin() {
    if (!token) return;
    setTwoFaBusy(true);
    setError(null);
    setScannerNote(null);
    try {
      setScanStage("Verifying shop location…");
      const coords = await readLocation();

      setScanStage("Connecting to L1 scanner — place YOUR merchant finger for daily sign-in…");
      const svc = await discover();
      const info = await deviceInfo(svc);
      const cap = await capture(svc, rdEnv, "", info);

      setScanStage("Verifying merchant daily 2FA…");
      const next = await api<AepsStatusView>("/api/v1/aeps/outlet-login", {
        token,
        method: "POST",
        body: JSON.stringify({
          pidXml: cap.pidData,
          captureType: "FINGER",
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setAepsStatus(next);
      setScannerNote("Merchant daily biometric sign-in verified. Your AePS counter is unlocked!");
    } catch (err) {
      setError(formatApiError(err, "Merchant biometric sign-in failed"));
    } finally {
      setScanStage(null);
      setTwoFaBusy(false);
    }
  }

  async function handleSendCustomerOtp() {
    if (!token) return;
    if (cleanAadhaar.length !== 12) {
      setError("Enter a valid 12-digit customer Aadhaar number first.");
      return;
    }
    if (cleanMob.length !== 10) {
      setError("Enter a valid 10-digit customer mobile number first.");
      return;
    }
    if (!Number.isInteger(numericAmount) || numericAmount <= cwOtpThreshold || numericAmount > maxAmt || numericAmount % stepAmt !== 0) {
      setError(`Enter a valid withdrawal amount above ₹${cwOtpThreshold} (up to ${inr(maxAmt)} in multiples of ₹${stepAmt}).`);
      return;
    }

    setOtpBusy(true);
    setError(null);
    try {
      setScanStage("Verifying shop location & requesting bank OTP…");
      const coords = await readLocation();
      const res = await api<{
        otpSessionId: string;
        otpRequired: boolean;
        validity?: string | null;
        expiresAt?: string | null;
        message?: string | null;
      }>("/api/v1/aeps/transaction-otp", {
        token,
        method: "POST",
        body: JSON.stringify({
          bankIin,
          aadhaarNumber: cleanAadhaar,
          customerMobile: cleanMob,
          amount: numericAmount,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setCustomerOtp("");
      setOtpSession({
        otpSessionId: res.otpSessionId,
        otpRequired: res.otpRequired,
        validity: res.validity,
        expiresAt: res.expiresAt,
        message: res.message,
        forAadhaar: cleanAadhaar,
        forBankIin: bankIin,
        forAmount: numericAmount,
      });
      if (res.message) {
        setScannerNote(res.message);
      }
    } catch (err) {
      const msg = formatApiError(err, "Could not request customer OTP");
      setError(msg);
      if (msg.toLowerCase().includes("sign-in") || msg.toLowerCase().includes("2fa")) {
        loadStatus(true).catch(() => undefined);
      }
    } finally {
      setScanStage(null);
      setOtpBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (cleanAadhaar.length !== 12) {
      setError("Enter a valid 12-digit customer Aadhaar number.");
      return;
    }
    if (cleanMob.length !== 10) {
      setError("Enter a valid 10-digit customer mobile number.");
      return;
    }
    if (mode === "CW" && (!Number.isInteger(numericAmount) || numericAmount < minAmt || numericAmount > maxAmt || numericAmount % stepAmt !== 0)) {
      setError(`Cash Withdrawal amount must be between ${inr(minAmt)} and ${inr(maxAmt)} in multiples of ₹${stepAmt}.`);
      return;
    }
    if (!consent) {
      setError("Confirm customer Aadhaar biometric consent before scanning.");
      return;
    }
    if (requiresOtpFlow && !activeOtpSession) {
      await handleSendCustomerOtp();
      return;
    }
    const cleanCustomerOtp = customerOtp.replace(/\D/g, "");
    if (requiresOtpFlow && activeOtpSession?.otpRequired && cleanCustomerOtp.length < 4) {
      setError("Enter the customer's SMS OTP before scanning their fingerprint.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      setScanStage("Verifying registered shop location…");
      const coords = await readLocation();

      setScanStage("Connecting to L1 fingerprint scanner — ask customer to place finger…");
      const svc = await discover();
      const info = await deviceInfo(svc);
      const otpForRd = requiresOtpFlow && activeOtpSession?.otpRequired ? cleanCustomerOtp : "";
      const cap = await capture(svc, rdEnv, "", info, otpForRd);

      setScanStage("Processing AePS transaction on NPCI banking switch…");
      const res = await api<AepsTxnView>("/api/v1/aeps/transact", {
        token,
        method: "POST",
        body: JSON.stringify({
          mode,
          aadhaarNumber: cleanAadhaar,
          bankIin,
          customerMobile: cleanMob,
          amount: mode === "CW" ? numericAmount : 0,
          pidXml: cap.pidData,
          captureType: "FINGER",
          otpSessionId: activeOtpSession?.otpSessionId ?? null,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      setReceipt(res);
      setAadhaar("");
      setOtpSession(null);
      setCustomerOtp("");
      loadHistory();
      loadStatus(false).catch(() => undefined);
      if (mode === "CW" && res.status === "SUCCESS") {
        loadProfile().catch(() => undefined);
      }
    } catch (err) {
      const msg = formatApiError(err, "AePS transaction could not be completed");
      setError(msg);
      if (activeOtpSession) {
        // Consumed OTP session cannot be reused; prompt fresh OTP on retry
        setOtpSession(null);
        setCustomerOtp("");
      }
      if (msg.toLowerCase().includes("sign-in") || msg.toLowerCase().includes("2fa") || msg.toLowerCase().includes("window expired")) {
        loadStatus(true).catch(() => undefined);
      }
    } finally {
      setScanStage(null);
      setBusy(false);
    }
  }

  async function handleRefreshPendingTxn(txn: AepsTxnView) {
    if (!token) return;
    setRefreshingTxnId(txn.id);
    setError(null);
    try {
      const updated = await api<AepsTxnView>(`/api/v1/aeps/transactions/${txn.id}/refresh`, {
        token,
        method: "POST",
      });
      setReceipt(updated);
      await loadHistory();
      if (updated.status === "SUCCESS") {
        loadProfile().catch(() => undefined);
      }
    } catch (err) {
      setError(formatApiError(err, "Could not refresh AePS transaction status"));
    } finally {
      setRefreshingTxnId(null);
    }
  }

  const twoFaRequired = aepsStatus ? aepsStatus.loginRequired || !aepsStatus.loggedInToday : false;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-950">AePS Banking Counter</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aadhaar Enabled Payment System — Cash Withdrawal, Balance Enquiry, and Mini Statement via L1 RD scanner.
          </p>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {scannerNote && <Alert tone="success">{scannerNote}</Alert>}

      {/* Merchant Daily 2FA Banner */}
      {statusLoading && !aepsStatus ? (
        <div className="h-24 rounded-3xl animate-pulse bg-slate-100" />
      ) : aepsStatus?.dormantOutlet ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-sm font-bold text-rose-950">
              Merchant AePS Terminal Inactive (180+ Days Dormant)
            </h3>
            <p className="text-xs text-rose-800 mt-1">
              NPCI requires re-onboarding outlets that have not transacted in 6 months. Please contact platform support to refresh your merchant terminal.
            </p>
          </div>
        </div>
      ) : twoFaRequired ? (
        <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  NPCI Daily Security Check
                </span>
                <h3 className="font-display text-base sm:text-lg font-bold text-navy-950 mt-0.5">
                  Merchant Daily Biometric Sign-In Required
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Connect your L1 fingerprint scanner and scan <strong>your own merchant finger</strong>
                  {aepsStatus?.aadhaarMasked ? ` (${aepsStatus.aadhaarMasked})` : ""} once today to unlock AePS Cash Withdrawal, Balance Enquiry, and Mini Statement.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={twoFaBusy || statusLoading}
                onClick={() => loadStatus(true)}
                className="btn-secondary !py-2 !px-3 text-xs inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? "animate-spin" : ""}`} />
                Re-check Status
              </button>
              <button
                type="button"
                disabled={twoFaBusy}
                onClick={handleMerchant2faLogin}
                className="btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-2"
              >
                {twoFaBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}
                {twoFaBusy ? "Scanning Merchant Finger…" : "Scan My Finger (Daily 2FA)"}
              </button>
            </div>
          </div>

          {scanStage && twoFaBusy && (
            <div className="rounded-2xl bg-navy-950 text-white px-4 py-3 flex items-center gap-3 text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
              <span>{scanStage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Merchant 2FA Active Today
              {aepsStatus?.aadhaarMasked ? ` · ${aepsStatus.aadhaarMasked}` : ""}
              {aepsStatus?.geofenceEnabled ? ` · Shop Geo-Fence (${aepsStatus.geofenceMaxKm ?? 3} km)` : ""}
            </span>
          </div>
          <button
            type="button"
            disabled={twoFaBusy}
            onClick={handleMerchant2faLogin}
            className="text-xs font-bold text-emerald-800 hover:text-navy-950 underline inline-flex items-center gap-1"
          >
            <Fingerprint className="h-3.5 w-3.5" />
            Refresh 2FA Sign-In
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: AePS Transaction Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  ["CW", "Cash Withdrawal"],
                  ["BE", "Balance Enquiry"],
                  ["MS", "Mini Statement"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMode(id);
                    setError(null);
                  }}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    mode === id ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCheckScanner}
              className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
            >
              <Usb className="h-3.5 w-3.5 text-emerald-600" />
              Test RD Scanner
            </button>
          </div>

          {/* Searchable Bank Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Customer Bank <span className="text-rose-600">*</span>
              </span>
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Filter bank name or IIN…"
                className="field !py-1 !px-2.5 !text-xs max-w-[13rem]"
              />
            </div>
            <select
              className="field"
              value={selectedBankKey}
              onChange={(e) => {
                setSelectedBankKey(e.target.value);
                setOtpSession(null);
              }}
              required
            >
              {filteredBanks.map((b, idx) => {
                const key = `${b.bankId || idx}:${b.iin}`;
                return (
                  <option key={key} value={key}>
                    {b.name} (IIN: {b.iin})
                  </option>
                );
              })}
            </select>
            {selectedBank?.failureRatePct != null && selectedBank.failureRatePct >= 75 && (
              <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                NPCI reports elevated bank switch timeouts ({selectedBank.failureRatePct}%) on {selectedBank.name} right now.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Customer 12-Digit Aadhaar <span className="text-rose-600">*</span>
              <input
                className="field mt-1 font-mono"
                inputMode="numeric"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="12-digit Aadhaar number"
                required
              />
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
          </div>

          {mode === "CW" && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Withdrawal Amount ({inr(minAmt)} – {inr(maxAmt)})
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      Number(amount) === q
                        ? "bg-navy-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-navy-950 hover:border-slate-300"
                    }`}
                  >
                    {inr(q)}
                  </button>
                ))}
              </div>
              <div className="relative max-w-xs">
                <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="field !pl-9 font-mono text-base font-bold"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  required
                />
              </div>
            </div>
          )}

          {/* >₹5,000 Customer OTP Section */}
          {requiresOtpFlow && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
                  <KeyRound className="h-4 w-4 text-sky-700 shrink-0" />
                  <span>Withdrawals above {inr(cwOtpThreshold)} require Customer Bank OTP verification</span>
                </div>
                <button
                  type="button"
                  disabled={otpBusy || twoFaRequired}
                  onClick={handleSendCustomerOtp}
                  className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                  {otpBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {activeOtpSession ? "Resend Customer OTP" : "Send Customer OTP"}
                </button>
              </div>

              {activeOtpSession && activeOtpSession.otpRequired && (
                <label className="block text-xs font-semibold text-slate-700 max-w-xs">
                  Enter Customer SMS OTP <span className="text-rose-600">*</span>
                  <input
                    className="field mt-1 font-mono tracking-widest text-base font-bold"
                    inputMode="numeric"
                    maxLength={8}
                    value={customerOtp}
                    onChange={(e) => setCustomerOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="6-digit OTP"
                  />
                </label>
              )}

              {activeOtpSession && !activeOtpSession.otpRequired && (
                <p className="text-xs font-semibold text-emerald-800">
                  On-Us bank verified — no SMS OTP needed. Click below to scan customer fingerprint!
                </p>
              )}
            </div>
          )}

          <label className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Customer has provided informed consent to authenticate their Aadhaar biometric via UIDAI L1 Registered Device for this banking transaction.
            </span>
          </label>

          {scanStage && !twoFaBusy && (
            <div className="rounded-2xl bg-navy-950 text-white px-4 py-3.5 flex items-center gap-3 text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
              <span>{scanStage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || otpBusy || twoFaRequired || Boolean(aepsStatus?.dormantOutlet)}
            className="btn-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Fingerprint className="h-4 w-4" />
            {twoFaRequired
              ? "Complete Merchant Daily 2FA Above First"
              : busy
                ? "Scanning & Submitting…"
                : requiresOtpFlow && !activeOtpSession
                  ? `Send Customer OTP for ${inr(numericAmount)}`
                  : mode === "CW"
                    ? `Scan Customer Finger & Withdraw ${inr(numericAmount)}`
                    : mode === "BE"
                      ? "Scan Customer Finger & Check Balance"
                      : "Scan Customer Finger & Fetch Mini Statement"}
          </button>
        </form>

        {/* Right: Recent AePS History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-navy-950 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Recent AePS Transactions
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
                No AePS transactions recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {history.slice(0, 12).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-950">
                          {item.aepsType === "CASH_WITHDRAWAL"
                            ? inr(item.amount)
                            : item.aepsType.replaceAll("_", " ")}
                        </span>
                        <StatusPill value={item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.bankName} · {item.aadhaarMasked} · {when(item.createdAt || undefined)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceipt(item)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy-950 hover:bg-slate-50 shrink-0"
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AePS Receipt Modal */}
      <Modal
        open={receipt != null}
        title="AePS Banking Receipt"
        description={receipt ? `${receipt.bankName} · Ref ${receipt.reference}` : undefined}
      >
        {receipt && (
          <div className="space-y-4 text-xs">
            <div
              className={`rounded-2xl border p-4 flex items-center justify-between ${
                receipt.status === "SUCCESS"
                  ? "bg-emerald-50 border-emerald-200"
                  : receipt.status === "PENDING"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {receipt.status === "PENDING" ? (
                  <Clock className="h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                <div>
                  <p className="font-bold text-navy-950">{receipt.aepsType.replaceAll("_", " ")}</p>
                  <p className="font-mono text-[11px] text-slate-600">RRN: {receipt.bankRrn || "—"}</p>
                </div>
              </div>
              <StatusPill value={receipt.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 p-4">
              {receipt.aepsType === "CASH_WITHDRAWAL" && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Withdrawn Amount</span>
                  <span className="font-display text-base font-bold text-navy-950">{inr(receipt.amount)}</span>
                </div>
              )}
              {receipt.availableBalance != null && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer A/C Balance</span>
                  <span className="font-display text-base font-bold text-emerald-700">
                    {inr(receipt.availableBalance)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Masked Aadhaar</span>
                <span className="font-mono font-semibold text-navy-950">{receipt.aadhaarMasked}</span>
              </div>
              {receipt.maskedAccountNumber && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer A/C</span>
                  <span className="font-mono font-semibold text-navy-950">{receipt.maskedAccountNumber}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank</span>
                <span className="font-semibold text-navy-950">{receipt.bankName}</span>
              </div>
            </div>

            {Array.isArray(receipt.miniStatement) && receipt.miniStatement.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2 font-bold text-[11px] uppercase text-slate-500">
                  Mini Statement
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {receipt.miniStatement.map((entry, idx) => {
                    const drCr = String(entry.txnType || "").toUpperCase();
                    return (
                      <div key={idx} className="px-3.5 py-2 flex items-center justify-between font-mono text-[11px]">
                        <span>
                          {String(entry.date || entry.txnDate || "—")} · {String(entry.narration || "")}
                        </span>
                        <span className={`font-bold ${drCr === "DR" ? "text-rose-700" : "text-emerald-700"}`}>
                          {drCr ? `${drCr} ` : ""}₹{String(entry.amount || "0.00")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {receipt.status === "PENDING" && (
                <button
                  type="button"
                  disabled={refreshingTxnId === receipt.id}
                  onClick={() => handleRefreshPendingTxn(receipt)}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshingTxnId === receipt.id ? "animate-spin" : ""}`} />
                  Refresh Status
                </button>
              )}
              {receipt.transactionId && (
                <Link
                  href={`/agent/transactions/${receipt.transactionId}`}
                  className="btn-secondary text-xs inline-flex items-center gap-1"
                >
                  Ledger Record
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs inline-flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="btn-primary text-xs inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
