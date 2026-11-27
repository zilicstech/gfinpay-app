"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Fingerprint,
  Loader2,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Usb,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { ApiClientError, api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Field, Modal, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { capture, deviceInfo, discover, readLocation } from "@/features/ekyc/rd-service";

const DEFAULT_EKYC_WADH = "E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc=";
const POPULAR_AMOUNTS = [500, 1000, 2000, 3000, 5000];
const OPEN_STATES = new Set(["HOLD", "PENDING", "IN_PROCESS", "SENT", "ON_HOLD"]);

type Beneficiary = {
  id: string;
  name: string;
  accountLast4?: string;
  accountMasked?: string;
  ifsc: string;
  bankId?: string | null;
  bankName?: string | null;
  beneficiaryMobile?: string | null;
  verified?: boolean;
  verifiedAt?: string | null;
};

type Remitter = {
  senderId: string;
  mobile: string;
  exists: boolean;
  status: "ACTIVE" | "REGISTRATION_REQUIRED" | "KYC_REQUIRED" | string;
  ekycVerified?: boolean;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  pincode?: string | null;
  limitPerTransaction?: number | null;
  limit?: number | null;
  dailyLimitMax?: number | null;
  dailyLimitAvailable?: number | null;
  monthlyLimitMax?: number | null;
  monthlyLimitAvailable?: number | null;
  impsAllowed?: boolean;
  neftAllowed?: boolean;
  wadh?: string | null;
  rdEnv?: string | null;
  beneficiaries?: Beneficiary[];
  message?: string;
};

type DmtBankOption = {
  bank_id: string;
  bank_name: string;
  ifsc_alias?: string | null;
  ifsc_global?: string | null;
  imps_enabled?: boolean;
  neft_enabled?: boolean;
  imps_failure_rate?: number | null;
  neft_failure_rate?: number | null;
};

type Quote = {
  sessionId: string;
  amount: number;
  fee: number;
  total: number;
  transferMode: string;
  otpRequired?: boolean;
  validity?: string | null;
  message?: string;
};

type Transfer = {
  transactionId: string;
  state: string;
  transferStatus?: string;
  refundState: string;
  amount: number;
  fee: number;
  total: number;
  transferMode: string;
  referenceId?: string;
  utr?: string;
  ackno?: string;
  txnStatus?: string;
  remitterMobile?: string;
  beneficiaryName?: string;
  accountMasked?: string;
  ifsc?: string;
  bankName?: string;
  message?: string;
  lastStatusPolledAt?: string | null;
  reconfirmedAt?: string | null;
  statusCheckThrottled?: boolean;
  statusCheckMessage?: string | null;
  createdAt?: string;
};

export function DmtDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [mobileQuery, setMobileQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [remitter, setRemitter] = useState<Remitter | null>(null);

  // One-time Remitter Registration & Biometric eKYC state
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regSessionId, setRegSessionId] = useState<string | null>(null);
  const [regOtpRequired, setRegOtpRequired] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [ekycConsent, setEkycConsent] = useState(true);
  const [scannerNote, setScannerNote] = useState<string | null>(null);
  const [ekycStage, setEkycStage] = useState<string | null>(null);

  // Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBene, setLoadingBene] = useState(false);
  const [selectedBene, setSelectedBene] = useState<Beneficiary | null>(null);

  // Add Beneficiary Modal
  const [addBeneOpen, setAddBeneOpen] = useState(false);
  const [beneName, setBeneName] = useState("");
  const [beneAccount, setBeneAccount] = useState("");
  const [beneIfsc, setBeneIfsc] = useState("");
  const [beneMobile, setBeneMobile] = useState("");
  const [beneBank, setBeneBank] = useState("");
  const [beneBankObj, setBeneBankObj] = useState<DmtBankOption | null>(null);
  const [bankHits, setBankHits] = useState<DmtBankOption[]>([]);
  const [beneSession, setBeneSession] = useState<string | null>(null);
  const [beneOtp, setBeneOtp] = useState("");
  const [addingBene, setAddingBene] = useState(false);

  // Delete Beneficiary OTP Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    bene: Beneficiary;
    sessionId: string;
    message?: string;
  } | null>(null);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deletingBene, setDeletingBene] = useState(false);

  // Transfer execution & Receipt
  const [amount, setAmount] = useState("");
  const [transferMode, setTransferMode] = useState<"IMPS" | "NEFT">("IMPS");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [txnOtp, setTxnOtp] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Transfer | null>(null);

  // Wallet & Recent History
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [refreshingTxnId, setRefreshingTxnId] = useState<string | null>(null);

  const loadWalletAndHistory = useCallback(async () => {
    if (!token) return;
    api<{ availableBalance: number }>("/api/v1/wallet", { token, silent: true })
      .then((res) => setWalletBalance(res.availableBalance))
      .catch(() => undefined);
    api<Transfer[]>("/api/v1/dmt/history?limit=15", { token, silent: true })
      .then((rows) => setHistory(Array.isArray(rows) ? rows : []))
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadWalletAndHistory();
  }, [token, loadWalletAndHistory]);

  useEffect(() => {
    if (!token || !addBeneOpen) return;
    const timer = setTimeout(() => {
      api<DmtBankOption[]>(`/api/v1/dmt/banks?q=${encodeURIComponent(beneBank)}&limit=40`, {
        token,
        silent: true,
      })
        .then((rows) => setBankHits(Array.isArray(rows) ? rows : []))
        .catch(() => setBankHits([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [token, addBeneOpen, beneBank]);

  function resetOnboardingState() {
    setRegAadhaar("");
    setRegSessionId(null);
    setRegOtpRequired(false);
    setRegOtp("");
    setEkycStage(null);
  }

  async function lookup(digits: string) {
    setSearching(true);
    flash.clear();
    setSelectedBene(null);
    setBeneficiaries([]);
    setQuote(null);
    resetOnboardingState();
    try {
      const found = await api<Remitter>(`/api/v1/dmt/remitter?mobile=${digits}`, { token });
      setRemitter(found);
      if (found.exists && found.status === "ACTIVE") {
        if (Array.isArray(found.beneficiaries)) {
          setBeneficiaries(found.beneficiaries);
        } else {
          await loadBeneficiaries(found.senderId);
        }
        if (found.impsAllowed === false && found.neftAllowed !== false) {
          setTransferMode("NEFT");
        } else {
          setTransferMode("IMPS");
        }
      }
    } catch (err) {
      setRemitter(null);
      flash.fail(err, "Could not look up this customer");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(e?: FormEvent) {
    if (e) e.preventDefault();
    if (mobileQuery.length !== 10) {
      flash.fail(null, "Enter a valid 10-digit customer mobile number");
      return;
    }
    await lookup(mobileQuery);
  }

  async function loadBeneficiaries(senderId: string) {
    setLoadingBene(true);
    try {
      const list = await api<Beneficiary[]>(`/api/v1/dmt/senders/${senderId}/beneficiaries`, { token });
      setBeneficiaries(Array.isArray(list) ? list : []);
    } catch (err) {
      setBeneficiaries([]);
      flash.fail(err, "Could not load beneficiaries");
    } finally {
      setLoadingBene(false);
    }
  }

  // ===========================================================================
  // One-Time Remitter Registration + Aadhaar Biometric eKYC
  // ===========================================================================

  async function handleRemitterRegister(e: FormEvent) {
    e.preventDefault();
    if (!remitter) return;
    if (regAadhaar.length !== 12) {
      flash.fail(null, "Enter a valid 12-digit customer Aadhaar number");
      return;
    }
    setRegBusy(true);
    flash.clear();
    try {
      const res = await api<{
        sessionId: string;
        senderId: string;
        mobile: string;
        otpRequired: boolean;
        status: string;
        wadh?: string;
        rdEnv?: string;
        message?: string;
      }>("/api/v1/dmt/remitter/register", {
        token,
        method: "POST",
        body: JSON.stringify({
          mobile: remitter.mobile,
          aadhaarNumber: regAadhaar,
        }),
      });
      setRegSessionId(res.sessionId);
      if (res.otpRequired && res.status === "OTP_REQUIRED") {
        setRegOtpRequired(true);
        flash.ok(res.message || "OTP sent to the customer's mobile number.");
      } else {
        setRegOtpRequired(false);
        setRemitter((prev) =>
          prev
            ? {
                ...prev,
                status: "KYC_REQUIRED",
                wadh: res.wadh || prev.wadh,
                rdEnv: res.rdEnv || prev.rdEnv,
                message: res.message || prev.message,
              }
            : prev,
        );
        flash.ok(res.message || "Registration recorded. Complete one-time customer fingerprint eKYC.");
      }
    } catch (err) {
      flash.fail(err, "Could not initiate remitter registration");
    } finally {
      setRegBusy(false);
    }
  }

  async function handleRemitterVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !regSessionId) return;
    setRegBusy(true);
    flash.clear();
    try {
      const res = await api<Remitter & { sessionId?: string }>("/api/v1/dmt/remitter/register/verify", {
        token,
        method: "POST",
        body: JSON.stringify({
          sessionId: regSessionId,
          otp: regOtp.trim(),
        }),
      });
      setRegOtpRequired(false);
      setRegOtp("");
      if (res.sessionId) {
        setRegSessionId(res.sessionId);
      }
      if (res.status === "ACTIVE") {
        setRemitter(res);
        setBeneficiaries(Array.isArray(res.beneficiaries) ? res.beneficiaries : []);
        flash.ok("Customer verified and ready for money transfer.");
      } else {
        setRemitter((prev) =>
          prev
            ? {
                ...prev,
                status: "KYC_REQUIRED",
                wadh: res.wadh || prev.wadh,
                rdEnv: res.rdEnv || prev.rdEnv,
                message: res.message || "Mobile OTP verified. Scan customer fingerprint once to complete eKYC.",
              }
            : prev,
        );
        flash.ok(res.message || "Mobile OTP verified. Scan customer fingerprint once to complete eKYC.");
      }
    } catch (err) {
      flash.fail(err, "Could not verify registration OTP");
    } finally {
      setRegBusy(false);
    }
  }

  async function handleCheckScanner() {
    flash.clear();
    setScannerNote(null);
    try {
      const svc = await discover();
      const info = await deviceInfo(svc);
      setScannerNote(
        `L1 Scanner Ready: ${info.model || info.dpId || "RD Device"} (${info.serial || `port ${svc.port}`})`,
      );
    } catch (err) {
      flash.fail(err, "Could not detect L1 fingerprint scanner");
    }
  }

  async function handleRemitterEkyc() {
    if (!remitter) return;
    if (!ekycConsent) {
      flash.fail(null, "Confirm customer consent for UIDAI Aadhaar biometric eKYC before scanning.");
      return;
    }
    setRegBusy(true);
    flash.clear();
    try {
      setEkycStage("Reading shop GPS location…");
      const loc = await readLocation();
      setEkycStage("Connecting to L1 fingerprint scanner…");
      const svc = await discover();
      const info = await deviceInfo(svc);
      setScannerNote(
        `L1 Scanner Ready: ${info.model || info.dpId || "RD Device"} (${info.serial || `port ${svc.port}`})`,
      );
      setEkycStage("Place customer finger on the glowing scanner…");
      const cap = await capture(
        svc,
        remitter.rdEnv || "P",
        remitter.wadh || DEFAULT_EKYC_WADH,
        info,
      );
      setEkycStage("Verifying one-time Aadhaar eKYC with banking switch…");
      const activeProfile = await api<Remitter>("/api/v1/dmt/remitter/ekyc", {
        token,
        method: "POST",
        body: JSON.stringify({
          mobile: remitter.mobile,
          sessionId: regSessionId || undefined,
          pidXml: cap.pidData,
          captureType: "FINGER",
          latitude: loc.latitude,
          longitude: loc.longitude,
          consent: true,
        }),
      });
      setRemitter(activeProfile);
      setBeneficiaries(Array.isArray(activeProfile.beneficiaries) ? activeProfile.beneficiaries : []);
      resetOnboardingState();
      flash.ok("One-time customer eKYC completed! You can now add beneficiaries and transfer funds.");
    } catch (err) {
      flash.fail(err, "Customer fingerprint eKYC could not be completed");
    } finally {
      setEkycStage(null);
      setRegBusy(false);
    }
  }

  // ===========================================================================
  // Beneficiary Management (OTP Register & OTP Delete)
  // ===========================================================================

  function resetBeneForm() {
    setBeneName("");
    setBeneAccount("");
    setBeneIfsc("");
    setBeneMobile("");
    setBeneBank("");
    setBeneBankObj(null);
    setBeneSession(null);
    setBeneOtp("");
    setBankHits([]);
  }

  async function handleBeneOtp(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !beneBankObj) {
      flash.fail(null, "Choose the recipient bank from the DMT bank list");
      return;
    }
    setAddingBene(true);
    flash.clear();
    try {
      const res = await api<{
        otpRequired: boolean;
        sessionId?: string;
        beneficiary?: Beneficiary;
        message?: string;
      }>(`/api/v1/dmt/senders/${remitter.senderId}/beneficiaries/otp`, {
        token,
        method: "POST",
        body: JSON.stringify({
          name: beneName.trim(),
          accountNumber: beneAccount.trim(),
          ifsc: beneIfsc.trim().toUpperCase(),
          bankId: beneBankObj.bank_id,
          beneficiaryMobile: beneMobile.trim() || remitter.mobile,
        }),
      });
      if (res.otpRequired === false && res.beneficiary) {
        setAddBeneOpen(false);
        resetBeneForm();
        await loadBeneficiaries(remitter.senderId);
        setSelectedBene(res.beneficiary);
        flash.ok(res.message || "Beneficiary added");
      } else if (res.sessionId) {
        setBeneSession(res.sessionId);
        flash.ok(res.message || "OTP sent to the customer's mobile");
      }
    } catch (err) {
      flash.fail(err, "Could not register beneficiary");
    } finally {
      setAddingBene(false);
    }
  }

  async function handleAddBeneficiary(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !beneSession) return;
    setAddingBene(true);
    flash.clear();
    try {
      const created = await api<Beneficiary>(`/api/v1/dmt/senders/${remitter.senderId}/beneficiaries`, {
        token,
        method: "POST",
        body: JSON.stringify({ sessionId: beneSession, otp: beneOtp.trim() }),
      });
      setAddBeneOpen(false);
      resetBeneForm();
      await loadBeneficiaries(remitter.senderId);
      setSelectedBene(created);
      flash.ok("Beneficiary verified and saved");
    } catch (err) {
      flash.fail(err, "Could not verify beneficiary OTP");
    } finally {
      setAddingBene(false);
    }
  }

  async function requestDeleteBene(bene: Beneficiary) {
    if (!remitter) return;
    setDeletingBene(true);
    flash.clear();
    try {
      const res = await api<{
        otpRequired: boolean;
        deleted: boolean;
        sessionId?: string;
        message?: string;
      }>(`/api/v1/dmt/beneficiaries/${bene.id}/delete-otp`, {
        token,
        method: "POST",
      });
      if (res.deleted && !res.otpRequired) {
        if (selectedBene?.id === bene.id) setSelectedBene(null);
        await loadBeneficiaries(remitter.senderId);
        flash.ok(res.message || "Beneficiary removed");
      } else if (res.sessionId) {
        setDeleteOtp("");
        setDeleteTarget({ bene, sessionId: res.sessionId, message: res.message });
      }
    } catch (err) {
      flash.fail(err, "Could not initiate beneficiary removal");
    } finally {
      setDeletingBene(false);
    }
  }

  async function confirmDeleteBene(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !deleteTarget) return;
    setDeletingBene(true);
    flash.clear();
    try {
      await api(`/api/v1/dmt/beneficiaries/${deleteTarget.bene.id}/delete-verify`, {
        token,
        method: "POST",
        body: JSON.stringify({
          sessionId: deleteTarget.sessionId,
          otp: deleteOtp.trim(),
        }),
      });
      if (selectedBene?.id === deleteTarget.bene.id) setSelectedBene(null);
      setDeleteTarget(null);
      setDeleteOtp("");
      await loadBeneficiaries(remitter.senderId);
      flash.ok("Beneficiary deleted");
    } catch (err) {
      flash.fail(err, "Could not verify deletion OTP");
    } finally {
      setDeletingBene(false);
    }
  }

  // ===========================================================================
  // Money Transfer & Webhook-Free Status Check / Reconfirm
  // ===========================================================================

  const numAmount = Number(amount) || 0;
  const perTxnCap = remitter?.limitPerTransaction ?? 5000;
  const availableCap = Math.min(
    perTxnCap,
    remitter?.dailyLimitAvailable ?? 25000,
    remitter?.monthlyLimitAvailable ?? remitter?.limit ?? 25000,
  );

  async function handleTxnOtp(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !selectedBene) return;
    if (numAmount < 100) {
      flash.fail(null, "Minimum DMT transfer amount is ₹100");
      return;
    }
    if (numAmount > availableCap) {
      flash.fail(null, `Amount exceeds customer's available transfer limit of ${inr(availableCap)}`);
      return;
    }
    setProcessing(true);
    flash.clear();
    try {
      const res = await api<Quote>("/api/v1/dmt/transactions/otp", {
        token,
        method: "POST",
        body: JSON.stringify({
          senderId: remitter.senderId,
          beneficiaryId: selectedBene.id,
          amount: numAmount,
          transferMode,
        }),
      });
      setQuote(res);
      setTxnOtp("");
      flash.ok(res.message || "Transfer OTP sent to the customer's mobile");
    } catch (err) {
      flash.fail(err, "Could not generate transfer OTP");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!quote) return;
    setProcessing(true);
    flash.clear();
    try {
      const loc = await readLocation();
      const res = await api<Transfer>("/api/v1/dmt/transactions", {
        token,
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({
          sessionId: quote.sessionId,
          otp: txnOtp.trim(),
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      });
      setReceipt(res);
      setQuote(null);
      setTxnOtp("");
      await loadWalletAndHistory();
      if (remitter) {
        // Refresh remitter available limits silently
        api<Remitter>(`/api/v1/dmt/remitter?mobile=${remitter.mobile}`, { token, silent: true })
          .then((updated) => setRemitter(updated))
          .catch(() => undefined);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.error.code === "DMT_OTP_REGENERATE_REQUIRED") {
        setQuote(null);
        setTxnOtp("");
      }
      flash.fail(err, formatApiError(err, "Transfer could not be completed"));
    } finally {
      setProcessing(false);
    }
  }

  async function refreshTransferStatus(txnId: string) {
    setRefreshingTxnId(txnId);
    flash.clear();
    try {
      const res = await api<Transfer>(`/api/v1/dmt/transactions/${txnId}/refresh`, {
        token,
        method: "POST",
        body: "{}",
      });
      if (receipt && receipt.transactionId === txnId) {
        setReceipt(res);
      }
      setHistory((prev) =>
        prev.map((item) => (item.transactionId === txnId ? { ...item, ...res } : item)),
      );
      await loadWalletAndHistory();
      if (res.statusCheckThrottled && res.statusCheckMessage) {
        flash.ok(res.statusCheckMessage);
      } else if (res.state === "SUCCESS" && res.reconfirmedAt) {
        flash.ok("Transfer settlement reconfirmed with the bank.");
      } else if (res.state === "REVERSED" || res.state === "FAILED") {
        flash.ok("Transfer reversed by bank and refunded to your MAIN wallet.");
      } else {
        flash.ok(res.message || `Transfer status: ${res.state}`);
      }
    } catch (err) {
      flash.fail(err, "Could not check transfer status");
    } finally {
      setRefreshingTxnId(null);
    }
  }

  function resetFlow() {
    setReceipt(null);
    setAmount("");
    setQuote(null);
    setTxnOtp("");
    setSelectedBene(null);
  }

  const active = remitter?.exists === true && remitter.status === "ACTIVE";
  const pendingTransfer =
    receipt != null && (OPEN_STATES.has(receipt.state) || OPEN_STATES.has(receipt.transferStatus || ""));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Zap className="h-4 w-4" />
              <span>{embedded ? "Merchant Full KYC Active · Live Counter" : "Direct Retail Desk"}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] text-slate-200">
                <MapPin className="h-3 w-3 text-emerald-400" />
                Shop Geo-Fenced
              </span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Domestic Money Transfer (DMT)
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Instant IMPS &amp; NEFT bank remittances. New customers complete Aadhaar + fingerprint eKYC once; returning customers go straight to transfer.
            </p>
          </div>
          <div className="min-w-[15rem] rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" /> MAIN Operating Wallet
              </span>
              <span className="font-semibold text-emerald-400">Live</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">
              {walletBalance !== null ? inr(walletBalance) : "—"}
            </p>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {receipt ? (
        <ReceiptCard
          receipt={receipt}
          pending={pendingTransfer}
          refreshing={refreshingTxnId === receipt.transactionId}
          onCheck={() => refreshTransferStatus(receipt.transactionId)}
          onReset={resetFlow}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: STEP 1 (REMITTER) + STEP 2 (BENEFICIARIES) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 1</span>
                  <h3 className="text-lg font-bold text-navy-950">Customer (Remitter) Lookup</h3>
                </div>
                {remitter && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-500 hover:text-navy-950"
                    onClick={() => {
                      setRemitter(null);
                      setSelectedBene(null);
                      setBeneficiaries([]);
                      setQuote(null);
                      setMobileQuery("");
                      resetOnboardingState();
                    }}
                  >
                    Change customer
                  </button>
                )}
              </div>

              {!remitter ? (
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      value={mobileQuery}
                      onChange={(e) => setMobileQuery(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter 10-digit customer mobile"
                      className="field !pl-14 text-lg font-medium tracking-wide"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || mobileQuery.length !== 10}
                    className="btn-primary shrink-0"
                  >
                    {searching ? "Checking…" : "Lookup"}
                  </button>
                </form>
              ) : remitter.status === "ACTIVE" ? (
                <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-navy-950">
                            {remitter.fullName || "Verified Customer"}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <BadgeCheck className="h-3 w-3" />
                            One-Time eKYC Verified
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-600 mt-0.5">
                          +91 {remitter.mobile}
                          {remitter.city ? ` · ${remitter.city}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {remitter.impsAllowed !== false && (
                        <span className="rounded-md bg-white border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          IMPS Ready
                        </span>
                      )}
                      {remitter.neftAllowed !== false && (
                        <span className="rounded-md bg-white border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          NEFT Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-emerald-200/60 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Monthly Available
                      </span>
                      <span className="font-bold text-emerald-800">
                        {inr(remitter.monthlyLimitAvailable ?? remitter.limit ?? 25000)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Daily Available
                      </span>
                      <span className="font-bold text-navy-950">
                        {inr(remitter.dailyLimitAvailable ?? 25000)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Per Transfer Cap
                      </span>
                      <span className="font-bold text-navy-950">
                        {inr(remitter.limitPerTransaction ?? 5000)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : remitter.status === "REGISTRATION_REQUIRED" ? (
                <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        One-Time Customer Onboarding · ₹0 Fee
                      </span>
                      <h4 className="mt-1.5 font-display text-base font-bold text-navy-950">
                        Register Customer (+91 {remitter.mobile})
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {remitter.message ||
                          "Register this customer once with Aadhaar + mobile OTP + fingerprint eKYC. Returning visits skip onboarding automatically."}
                      </p>
                    </div>
                  </div>

                  {!regOtpRequired ? (
                    <form onSubmit={handleRemitterRegister} className="space-y-3">
                      <Field label="Customer 12-Digit Aadhaar Number">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={12}
                          value={regAadhaar}
                          onChange={(e) => setRegAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                          placeholder="Enter 12-digit Aadhaar (encrypted immediately, never stored)"
                          className="field font-mono tracking-wider bg-white"
                          required
                        />
                      </Field>
                      <button
                        type="submit"
                        disabled={regBusy || regAadhaar.length !== 12}
                        className="btn-primary inline-flex items-center gap-2 text-xs"
                      >
                        {regBusy ? "Sending OTP…" : "Send Registration OTP"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRemitterVerifyOtp} className="space-y-3">
                      <Field label="6-Digit Customer Mobile OTP">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          value={regOtp}
                          onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                          placeholder="Enter OTP received on customer mobile"
                          className="field font-mono tracking-widest bg-white"
                          required
                        />
                      </Field>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={regBusy || regOtp.length < 4}
                          className="btn-primary inline-flex items-center gap-2 text-xs"
                        >
                          {regBusy ? "Verifying…" : "Verify OTP & Continue to eKYC"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={regBusy}
                          onClick={() => {
                            setRegOtpRequired(false);
                            setRegOtp("");
                          }}
                          className="btn-secondary text-xs"
                        >
                          Resend / Change Aadhaar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* KYC_REQUIRED: One-Time Remitter Fingerprint eKYC */
                <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 border border-sky-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-900">
                        Final Onboarding Step · One-Time Biometric eKYC
                      </span>
                      <h4 className="mt-1.5 font-display text-base font-bold text-navy-950">
                        Verify Customer Fingerprint (+91 {remitter.mobile})
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {remitter.message ||
                          "Scan the customer's finger on your L1 RD scanner once. Once verified, eKYC is never requested again."}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={regBusy}
                      onClick={handleCheckScanner}
                      className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 bg-white"
                    >
                      <Usb className="h-3.5 w-3.5" />
                      Check Scanner
                    </button>
                  </div>

                  {scannerNote && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{scannerNote}</span>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ekycConsent}
                      onChange={(e) => setEkycConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      The customer voluntarily consents to one-time UIDAI Aadhaar biometric authentication for Domestic Money Transfer KYC.
                    </span>
                  </label>

                  {ekycStage && (
                    <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-navy-950 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      <span>{ekycStage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={regBusy || !ekycConsent}
                      onClick={handleRemitterEkyc}
                      className="btn-primary inline-flex items-center gap-2 text-xs"
                    >
                      <Fingerprint className="h-4 w-4" />
                      {regBusy ? "Scanning & Verifying…" : "Scan Customer Fingerprint & Complete eKYC"}
                    </button>
                    <button
                      type="button"
                      disabled={regBusy}
                      onClick={() => lookup(remitter.mobile)}
                      className="btn-secondary text-xs bg-white"
                    >
                      Re-check Status
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: BENEFICIARIES */}
            {active && (
              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 2</span>
                    <h3 className="text-lg font-bold text-navy-950">
                      Select Recipient Bank Account ({beneficiaries.length}/20)
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={beneficiaries.length >= 20}
                    onClick={() => {
                      resetBeneForm();
                      setAddBeneOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Recipient Bank
                  </button>
                </div>

                {loadingBene ? (
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                ) : beneficiaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-navy-950">No recipient accounts saved yet</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Click &ldquo;Add Recipient Bank&rdquo; to register a bank account with customer OTP verification.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {beneficiaries.map((b) => {
                      const isSelected = selectedBene?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBene(b);
                            setQuote(null);
                          }}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-bold text-navy-950">{b.name}</p>
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            ) : b.verified ? (
                              <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                                Verified
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                            {b.accountMasked || `••••${b.accountLast4 || ""}`}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="font-mono">{b.ifsc}</span>
                            <span className="truncate">{b.bankName || b.bankId || "Bank"}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-bold">
                            <span className="text-emerald-700">
                              {isSelected ? "Selected for transfer" : "Click to select"}
                            </span>
                            <button
                              type="button"
                              disabled={deletingBene}
                              className="inline-flex items-center gap-1 text-rose-700 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteBene(b);
                              }}
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STEP 3 (TRANSFER DETAILS & OTP) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 3</span>
                <h3 className="text-lg font-bold text-navy-950">Transfer &amp; Settlement</h3>
              </div>

              {!selectedBene ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-center text-slate-400">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-xs">
                    Verify customer in Step 1 and select a recipient bank account in Step 2.
                  </p>
                </div>
              ) : (
                <form onSubmit={quote ? handleSend : handleTxnOtp} className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient</p>
                    <p className="font-bold text-navy-950">{selectedBene.name}</p>
                    <p className="font-mono text-xs text-slate-600">
                      {selectedBene.accountMasked || `••••${selectedBene.accountLast4}`} · {selectedBene.ifsc}
                      {selectedBene.bankName ? ` (${selectedBene.bankName})` : ""}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-600">Transfer amount (₹)</label>
                      <span className="text-[11px] text-slate-400">
                        ₹100 – {inr(availableCap)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={100}
                      max={availableCap}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setQuote(null);
                      }}
                      placeholder="1000"
                      className="field text-2xl font-bold tracking-tight text-navy-950"
                      required
                      disabled={!!quote}
                    />
                  </div>

                  {!quote && (
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_AMOUNTS.filter((p) => p <= availableCap).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAmount(String(p))}
                          className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                            Number(amount) === p ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {inr(p)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {(["IMPS", "NEFT"] as const).map((mode) => {
                      const allowed =
                        mode === "IMPS"
                          ? remitter?.impsAllowed !== false
                          : remitter?.neftAllowed !== false;
                      return (
                        <button
                          key={mode}
                          type="button"
                          disabled={!!quote || !allowed}
                          onClick={() => setTransferMode(mode)}
                          className={`rounded-2xl border p-3 text-left transition-all disabled:opacity-50 ${
                            transferMode === mode
                              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                              : "border-slate-200"
                          }`}
                        >
                          <p className="text-xs font-bold text-navy-950">{mode}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {mode === "IMPS" ? "Instant 24×7 rail" : "RBI batch settlement"}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {quote && (
                    <>
                      <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Transfer amount</span>
                          <span className="font-semibold">{inr(quote.amount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>DMT wallet surcharge</span>
                          <span className="font-semibold">{inr(quote.fee)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-navy-950">
                          <span>Total MAIN wallet debit</span>
                          <span>{inr(quote.total)}</span>
                        </div>
                      </div>

                      {quote.otpRequired !== false && (
                        <Field label="Customer Transfer OTP">
                          <input
                            value={txnOtp}
                            onChange={(e) => setTxnOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            inputMode="numeric"
                            placeholder="Enter OTP sent to customer mobile"
                            className="field font-mono tracking-widest"
                            required
                          />
                        </Field>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={processing || numAmount < 100}
                    className="btn-primary w-full justify-center py-3.5 text-base"
                  >
                    {processing
                      ? "Processing…"
                      : quote
                        ? `Confirm & Send ${inr(quote.amount)}`
                        : "Generate Transfer OTP"}
                    {!processing && <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </button>

                  {quote && (
                    <button
                      type="button"
                      className="w-full text-xs font-semibold text-slate-500 hover:text-navy-950"
                      onClick={() => {
                        setQuote(null);
                        setTxnOtp("");
                      }}
                    >
                      Change amount or mode
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECENT DMT TRANSFERS + CHECK STATUS / RECONFIRM */}
      {history.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">Recent DMT Transfers</h3>
              <p className="text-xs text-slate-500">
                Check pending transfers or reconfirm bank settlement status (IMPS / NEFT) anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={loadWalletAndHistory}
              className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Mode / UTR</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => {
                  const isPending =
                    OPEN_STATES.has(item.state) || OPEN_STATES.has(item.transferStatus || "");
                  const isSuccess = item.state === "SUCCESS";
                  const canCheck = isPending || isSuccess;
                  const busyRow = refreshingTxnId === item.transactionId;
                  return (
                    <tr key={item.transactionId} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {item.createdAt ? when(item.createdAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-navy-950 text-xs">
                          {item.beneficiaryName || "Beneficiary"}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {item.accountMasked || "—"} {item.ifsc ? `· ${item.ifsc}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-navy-950">{item.transferMode}</span>
                        <span className="block font-mono text-[11px] text-slate-500">
                          {item.utr ? `UTR: ${item.utr}` : item.referenceId || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-navy-950">{inr(item.amount)}</span>
                        <span className="block text-[11px] text-slate-400">
                          +{inr(item.fee)} fee
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusPill value={item.state} />
                          {item.reconfirmedAt && isSuccess && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Reconfirmed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {canCheck && (
                            <button
                              type="button"
                              disabled={busyRow}
                              onClick={() => refreshTransferStatus(item.transactionId)}
                              className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                            >
                              <RefreshCw className={`h-3 w-3 ${busyRow ? "animate-spin" : ""}`} />
                              {busyRow
                                ? "Checking…"
                                : isPending
                                  ? "Check Status"
                                  : "Reconfirm"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceipt(item)}
                            className="text-xs font-bold text-navy-950 underline"
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BENEFICIARY MODAL */}
      <Modal
        open={addBeneOpen}
        onClose={() => {
          setAddBeneOpen(false);
          resetBeneForm();
        }}
        title={beneSession ? "Verify Beneficiary OTP" : "Add Recipient Bank Account"}
        description={
          beneSession
            ? "Enter the OTP sent to the customer's mobile number to verify this recipient bank account."
            : "Search the DMT bank directory, confirm the IFSC code, and send an OTP to the customer."
        }
      >
        {!beneSession ? (
          <form onSubmit={handleBeneOtp} className="space-y-3 pt-2">
            <Field label="Recipient Bank">
              <input
                required
                value={beneBank}
                onChange={(e) => {
                  setBeneBank(e.target.value);
                  setBeneBankObj(null);
                }}
                placeholder="Search bank name or IFSC alias (e.g. SBI, HDFC, PNB)"
                className="field"
              />
              {beneBankObj && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <span>Selected: {beneBankObj.bank_name}</span>
                  {beneBankObj.imps_enabled !== false && (
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px]">
                      IMPS
                    </span>
                  )}
                  {beneBankObj.neft_enabled !== false && (
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px]">
                      NEFT
                    </span>
                  )}
                </div>
              )}
              {!beneBankObj && bankHits.length > 0 && (
                <ul className="mt-2 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {bankHits.map((bank) => (
                    <li key={bank.bank_id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                        onClick={() => {
                          setBeneBank(bank.bank_name);
                          setBeneBankObj(bank);
                          if (bank.ifsc_global && !beneIfsc) {
                            setBeneIfsc(bank.ifsc_global.toUpperCase());
                          }
                          setBankHits([]);
                        }}
                      >
                        <div>
                          <p className="font-semibold text-navy-950">{bank.bank_name}</p>
                          {bank.ifsc_global && (
                            <p className="font-mono text-[10px] text-slate-400">
                              Global IFSC: {bank.ifsc_global}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {bank.imps_enabled !== false && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              IMPS
                            </span>
                          )}
                          {bank.neft_enabled !== false && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              NEFT
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>

            <Field label="Account Holder Name">
              <input
                required
                value={beneName}
                onChange={(e) => setBeneName(e.target.value)}
                placeholder="Full name as per bank account"
                className="field"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bank Account Number">
                <input
                  required
                  value={beneAccount}
                  onChange={(e) => setBeneAccount(e.target.value.replace(/\s/g, ""))}
                  className="field font-mono"
                />
              </Field>
              <Field label="Bank IFSC Code (11 chars)">
                <input
                  required
                  maxLength={11}
                  value={beneIfsc}
                  onChange={(e) => setBeneIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="e.g. SBIN0000001"
                  className="field font-mono uppercase"
                />
              </Field>
            </div>

            <Field label="Beneficiary Mobile (Optional — defaults to customer mobile)">
              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                value={beneMobile}
                onChange={(e) => setBeneMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={remitter?.mobile || "10-digit mobile"}
                className="field font-mono"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  setAddBeneOpen(false);
                  resetBeneForm();
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingBene || !beneBankObj || beneIfsc.length !== 11}
                className="btn-primary text-xs"
              >
                {addingBene ? "Sending OTP…" : "Send Customer OTP"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddBeneficiary} className="space-y-3 pt-2">
            <Field label="Customer OTP">
              <input
                required
                value={beneOtp}
                onChange={(e) => setBeneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                placeholder="Enter OTP received on customer mobile"
                className="field font-mono tracking-widest"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" className="btn-secondary text-xs" onClick={() => setBeneSession(null)}>
                Back
              </button>
              <button type="submit" disabled={addingBene || !beneOtp} className="btn-primary text-xs">
                {addingBene ? "Verifying…" : "Verify & Add Beneficiary"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE BENEFICIARY OTP MODAL */}
      <Modal
        open={deleteTarget != null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteOtp("");
        }}
        title="Confirm Beneficiary Removal"
        description={
          deleteTarget?.message ||
          "Enter the OTP sent to the customer's mobile number to remove this recipient account."
        }
      >
        {deleteTarget && (
          <form onSubmit={confirmDeleteBene} className="space-y-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-bold text-navy-950">{deleteTarget.bene.name}</p>
              <p className="font-mono text-slate-600">
                {deleteTarget.bene.accountMasked} · {deleteTarget.bene.ifsc}
              </p>
            </div>
            <Field label="Customer Deletion OTP">
              <input
                required
                value={deleteOtp}
                onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                className="field font-mono tracking-widest"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={deletingBene}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteOtp("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deletingBene || !deleteOtp}
                className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                {deletingBene ? "Removing…" : "Confirm Removal"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function ReceiptCard({
  receipt,
  pending,
  refreshing,
  onCheck,
  onReset,
}: {
  receipt: Transfer;
  pending: boolean;
  refreshing: boolean;
  onCheck: () => void;
  onReset: () => void;
}) {
  const success = receipt.state === "SUCCESS";
  const reversed = receipt.state === "REVERSED" || receipt.state === "FAILED";
  const canCheckOrReconfirm = pending || success;

  return (
    <div className="space-y-6 rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-2xl sm:p-10">
      <div className="mx-auto max-w-md text-center space-y-2">
        <div className="flex justify-center">
          {success ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {receipt.reconfirmedAt ? "Bank Settlement Reconfirmed" : "Transfer Settled"}
            </span>
          ) : pending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-4 w-4 text-amber-600" />
              Awaiting Bank Confirmation
            </span>
          ) : (
            <StatusPill value={receipt.state} />
          )}
        </div>

        <h2 className="font-display text-2xl font-bold text-navy-950">
          {success
            ? "Transfer Successful"
            : pending
              ? "Transfer Under Processing"
              : reversed
                ? "Transfer Reversed & Refunded"
                : "Transfer Status"}
        </h2>
        <p className="text-sm text-slate-500">
          {receipt.message ||
            (success
              ? "Funds were sent to the recipient bank account."
              : pending
                ? "Funds are safely held while the bank confirms settlement. Use Check Status after 30 minutes or let auto-reconciliation update it."
                : "Your MAIN wallet was credited back automatically.")}
        </p>
        <p className="pt-2 font-display text-4xl font-extrabold text-emerald-600">
          {inr(receipt.amount)}
        </p>
        <p className="text-xs text-slate-400">
          Surcharge {inr(receipt.fee)} · Total {inr(receipt.total)} · {receipt.transferMode}
        </p>
      </div>

      {receipt.statusCheckThrottled && receipt.statusCheckMessage && (
        <div className="mx-auto max-w-md">
          <Alert tone="info">{receipt.statusCheckMessage}</Alert>
        </div>
      )}

      <div className="mx-auto max-w-md divide-y divide-slate-200/60 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm">
        <Row label="Transaction ID" value={receipt.transactionId} mono />
        <Row label="External Ref" value={receipt.referenceId || "—"} mono />
        <Row label="Bank UTR / RRN" value={receipt.utr || "—"} mono />
        <Row label="Switch Ref" value={receipt.ackno || "—"} mono />
        <Row label="Recipient" value={receipt.beneficiaryName || "—"} />
        <Row
          label="Bank Account"
          value={`${receipt.accountMasked || "—"}${receipt.ifsc ? ` (${receipt.ifsc})` : ""}`}
          mono
        />
        {receipt.bankName && <Row label="Bank" value={receipt.bankName} />}
        <Row
          label="Status"
          value={`${receipt.state}${
            receipt.refundState && receipt.refundState !== "NONE" ? ` · ${receipt.refundState}` : ""
          }`}
        />
        {receipt.reconfirmedAt && (
          <Row label="Reconfirmed At" value={when(receipt.reconfirmedAt)} />
        )}
        {receipt.lastStatusPolledAt && !receipt.reconfirmedAt && (
          <Row label="Last Checked" value={when(receipt.lastStatusPolledAt)} />
        )}
        {receipt.createdAt && <Row label="Initiated At" value={when(receipt.createdAt)} />}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {canCheckOrReconfirm && (
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            disabled={refreshing}
            onClick={onCheck}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing
              ? "Checking Bank Status…"
              : pending
                ? "Check Status"
                : "Reconfirm Status"}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold"
        >
          <Printer className="h-4 w-4" /> Print Receipt
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          <RotateCcw className="h-4 w-4" /> New Transfer
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-right text-xs font-semibold text-navy-950 break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
