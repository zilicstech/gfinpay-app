"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Field, Modal } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { DmtActivation } from "@/features/ekyc/MerchantEkycDesk";

type Remitter = {
  senderId: string;
  mobile: string;
  exists: boolean;
  status: string;
  limit?: number | null;
  accountOpeningUrl?: string | null;
  message?: string;
  rejections?: { RejectionType?: string; Remarks?: string }[];
};

type Beneficiary = {
  id: string;
  name: string;
  accountLast4?: string;
  accountMasked?: string;
  ifsc: string;
  bankId?: string;
  bankName?: string;
  verified?: boolean;
};

type Quote = {
  sessionId: string;
  amount: number;
  fee: number;
  total: number;
  transferMode: string;
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
  message?: string;
  providerCharge?: number | null;
  providerGst?: number | null;
  providerTds?: number | null;
  providerCommission?: number | null;
  beneficiaryName?: string;
  accountMasked?: string;
  createdAt?: string;
};

const POPULAR_AMOUNTS = [500, 1000, 2000, 3000, 5000];
const OPEN = new Set(["HOLD", "PENDING", "IN_PROCESS", "SENT", "ON_HOLD"]);

export function DmtDesk() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [mobileQuery, setMobileQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [remitter, setRemitter] = useState<Remitter | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBene, setLoadingBene] = useState(false);
  const [selectedBene, setSelectedBene] = useState<Beneficiary | null>(null);

  const [addBeneOpen, setAddBeneOpen] = useState(false);
  const [beneName, setBeneName] = useState("");
  const [beneAccount, setBeneAccount] = useState("");
  const [beneIfsc, setBeneIfsc] = useState("");
  const [beneBank, setBeneBank] = useState("");
  const [beneBankId, setBeneBankId] = useState("");
  const [bankHits, setBankHits] = useState<{ bank_id: string; bank_name: string }[]>([]);
  const [beneSession, setBeneSession] = useState<string | null>(null);
  const [beneOtp, setBeneOtp] = useState("");
  const [addingBene, setAddingBene] = useState(false);

  const [amount, setAmount] = useState("");
  const [transferMode, setTransferMode] = useState<"IMPS" | "NEFT">("IMPS");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [txnOtp, setTxnOtp] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Transfer | null>(null);
  const [refundOtp, setRefundOtp] = useState("");
  const [refundReady, setRefundReady] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [dmtActive, setDmtActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    api<{ dmtActive?: boolean }>("/api/v1/me/ekyc", { token })
      .then((res) => setDmtActive(res.dmtActive === true))
      .catch(() => setDmtActive(false));
    api<{ availableBalance: number }>("/api/v1/wallet", { token })
      .then((res) => setWalletBalance(res.availableBalance))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !addBeneOpen) return;
    const timer = setTimeout(() => {
      api<{ bank_id: string; bank_name: string }[]>(`/api/v1/dmt/banks?q=${encodeURIComponent(beneBank)}`, { token })
        .then((rows) => setBankHits(Array.isArray(rows) ? rows : []))
        .catch(() => setBankHits([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [token, addBeneOpen, beneBank]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data !== "ps-dmt-ao-done") return;
      if (mobileQuery.length === 10) lookup(mobileQuery);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  async function lookup(digits: string) {
    setSearching(true);
    flash.clear();
    setSelectedBene(null);
    setBeneficiaries([]);
    setQuote(null);
    try {
      const found = await api<Remitter>(`/api/v1/dmt/remitter?mobile=${digits}`, { token });
      setRemitter(found);
      if (found.exists && found.status === "ACTIVE") {
        await loadBeneficiaries(found.senderId);
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
      flash.fail(null, "Enter a valid 10-digit mobile number");
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

  function resetBeneForm() {
    setBeneName("");
    setBeneAccount("");
    setBeneIfsc("");
    setBeneBank("");
    setBeneBankId("");
    setBeneSession(null);
    setBeneOtp("");
    setBankHits([]);
  }

  async function handleBeneOtp(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !beneBankId) {
      flash.fail(null, "Choose the beneficiary bank from the list");
      return;
    }
    setAddingBene(true);
    try {
      const res = await api<{ sessionId: string; message?: string }>(
        `/api/v1/dmt/senders/${remitter.senderId}/beneficiaries/otp`,
        {
          token,
          method: "POST",
          body: JSON.stringify({
            name: beneName.trim(),
            accountNumber: beneAccount.trim(),
            ifsc: beneIfsc.trim().toUpperCase(),
            bankId: beneBankId,
          }),
        },
      );
      setBeneSession(res.sessionId);
      flash.ok(res.message || "OTP sent to the customer");
    } catch (err) {
      flash.fail(err, "Could not send the beneficiary OTP");
    } finally {
      setAddingBene(false);
    }
  }

  async function handleAddBeneficiary(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !beneSession) return;
    setAddingBene(true);
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
      flash.ok("Beneficiary added");
    } catch (err) {
      flash.fail(err, "Could not add the beneficiary");
    } finally {
      setAddingBene(false);
    }
  }

  async function verifyBene(bene: Beneficiary) {
    try {
      await api(`/api/v1/dmt/beneficiaries/${bene.id}/verify`, { token, method: "POST" });
      if (remitter) await loadBeneficiaries(remitter.senderId);
      flash.ok("Beneficiary verified");
    } catch (err) {
      flash.fail(err, "Could not verify the beneficiary");
    }
  }

  async function deleteBene(bene: Beneficiary) {
    try {
      await api(`/api/v1/dmt/beneficiaries/${bene.id}`, { token, method: "DELETE" });
      if (selectedBene?.id === bene.id) setSelectedBene(null);
      if (remitter) await loadBeneficiaries(remitter.senderId);
      flash.ok("Beneficiary deleted");
    } catch (err) {
      flash.fail(err, "Could not delete the beneficiary");
    }
  }

  async function handleTxnOtp(e: FormEvent) {
    e.preventDefault();
    if (!remitter || !selectedBene || numAmount <= 0) return;
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
      flash.ok(res.message || "OTP sent to the customer");
    } catch (err) {
      flash.fail(err, "Could not send the transfer OTP");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!quote) return;
    setProcessing(true);
    try {
      const res = await api<Transfer>("/api/v1/dmt/transactions", {
        token,
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({ sessionId: quote.sessionId, otp: txnOtp.trim() }),
      });
      setReceipt(res);
      setQuote(null);
      const wallet = await api<{ availableBalance: number }>("/api/v1/wallet", { token });
      setWalletBalance(wallet.availableBalance);
    } catch (err) {
      flash.fail(err, formatApiError(err, "Transfer failed"));
    } finally {
      setProcessing(false);
    }
  }

  async function refreshStatus() {
    if (!receipt) return;
    setProcessing(true);
    try {
      const res = await api<Transfer>(`/api/v1/dmt/transactions/${receipt.transactionId}/status`, { token });
      setReceipt(res);
    } catch (err) {
      flash.fail(err, "Could not check the transfer");
    } finally {
      setProcessing(false);
    }
  }

  async function sendRefundOtp() {
    if (!receipt) return;
    setProcessing(true);
    try {
      const res = await api<{ message?: string }>(`/api/v1/dmt/transactions/${receipt.transactionId}/refund/otp`, {
        token,
        method: "POST",
      });
      setRefundReady(true);
      flash.ok(res.message || "Refund OTP sent to the customer");
    } catch (err) {
      flash.fail(err, "Could not send the refund OTP");
    } finally {
      setProcessing(false);
    }
  }

  async function claimRefund(e: FormEvent) {
    e.preventDefault();
    if (!receipt) return;
    setProcessing(true);
    try {
      const res = await api<Transfer>(`/api/v1/dmt/transactions/${receipt.transactionId}/refund`, {
        token,
        method: "POST",
        body: JSON.stringify({ otp: refundOtp.trim() }),
      });
      setReceipt(res);
      setRefundReady(false);
      flash.ok("Refund claimed");
    } catch (err) {
      flash.fail(err, "Could not claim the refund");
    } finally {
      setProcessing(false);
    }
  }

  function resetFlow() {
    setReceipt(null);
    setAmount("");
    setQuote(null);
    setTxnOtp("");
    setSelectedBene(null);
    setRefundOtp("");
    setRefundReady(false);
  }

  const numAmount = Number(amount) || 0;
  const active = remitter?.exists === true && remitter.status === "ACTIVE";
  const pendingTransfer = receipt != null && (OPEN.has(receipt.state) || OPEN.has(receipt.transferStatus || ""));

  if (dmtActive === null) {
    return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;
  }
  if (!dmtActive) {
    return <DmtActivation onActivated={() => setDmtActive(true)} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Zap className="h-4 w-4" />
              Direct Retail Desk
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Domestic Money Transfer (DMT)</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Look up the customer, add a beneficiary with their OTP, then send the transfer OTP.</p>
          </div>
          <div className="min-w-[15rem] rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-emerald-400" /> Counter float</span>
              <span className="font-semibold text-emerald-400">Live</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight">{walletBalance !== null ? inr(walletBalance) : "—"}</p>
          </div>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {receipt ? (
        <Receipt
          receipt={receipt}
          pending={pendingTransfer}
          processing={processing}
          refundReady={refundReady}
          refundOtp={refundOtp}
          onRefundOtp={setRefundOtp}
          onCheck={refreshStatus}
          onSendRefund={sendRefundOtp}
          onClaim={claimRefund}
          onReset={resetFlow}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 1</span>
                  <h3 className="text-lg font-bold text-navy-950">Customer mobile</h3>
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
                    }}
                  >
                    Change customer
                  </button>
                )}
              </div>
              {!remitter ? (
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      value={mobileQuery}
                      onChange={(e) => setMobileQuery(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter 10-digit mobile"
                      className="field !pl-14 text-lg font-medium tracking-wide"
                      required
                    />
                  </div>
                  <button type="submit" disabled={searching || mobileQuery.length !== 10} className="btn-primary shrink-0">
                    {searching ? "Searching..." : "Lookup"}
                  </button>
                </form>
              ) : (
                <RemitterCard remitter={remitter} onRecheck={() => lookup(remitter.mobile)} checking={searching} />
              )}
            </div>

            {active && (
              <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 2</span>
                    <h3 className="text-lg font-bold text-navy-950">Select recipient bank</h3>
                  </div>
                  <button type="button" onClick={() => { resetBeneForm(); setAddBeneOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                    <Plus className="h-3.5 w-3.5" /> Add new bank
                  </button>
                </div>
                {loadingBene ? (
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ) : beneficiaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-navy-950">No beneficiaries yet</p>
                    <p className="mt-0.5 text-xs text-slate-500">Adding one sends an OTP to the customer.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {beneficiaries.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => { setSelectedBene(b); setQuote(null); }}
                        className={`cursor-pointer rounded-2xl border p-4 ${selectedBene?.id === b.id ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-navy-950">{b.name}</p>
                          {selectedBene?.id === b.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-600">{b.accountMasked || `•••• ${b.accountLast4 || ""}`}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono">{b.ifsc}</span>
                          <span>{b.bankName || b.bankId || "Bank"}</span>
                        </div>
                        <div className="mt-3 flex gap-3 text-[11px] font-bold">
                          <button type="button" className="text-navy-950 underline" onClick={(e) => { e.stopPropagation(); verifyBene(b); }}>Verify</button>
                          <button type="button" className="inline-flex items-center gap-1 text-rose-700" onClick={(e) => { e.stopPropagation(); deleteBene(b); }}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 3</span>
                <h3 className="text-lg font-bold text-navy-950">Transfer details</h3>
              </div>
              {!selectedBene ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-center text-slate-400">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-xs">Look up an active customer and pick a beneficiary.</p>
                </div>
              ) : (
                <form onSubmit={quote ? handleSend : handleTxnOtp} className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recipient</p>
                    <p className="font-bold text-navy-950">{selectedBene.name}</p>
                    <p className="font-mono text-xs text-slate-500">{selectedBene.accountMasked || selectedBene.accountLast4} ({selectedBene.ifsc})</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Transfer amount (₹)</label>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
                      placeholder="0.00"
                      className="field text-2xl font-bold tracking-tight text-navy-950"
                      required
                      disabled={!!quote}
                    />
                  </div>
                  {!quote && (
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_AMOUNTS.map((p) => (
                        <button key={p} type="button" onClick={() => setAmount(String(p))} className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${Number(amount) === p ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                          +{inr(p)}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(["IMPS", "NEFT"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={!!quote}
                        onClick={() => setTransferMode(mode)}
                        className={`rounded-2xl border p-3 text-left ${transferMode === mode ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20" : "border-slate-200"}`}
                      >
                        <p className="text-xs font-bold text-navy-950">{mode}</p>
                      </button>
                    ))}
                  </div>
                  {quote && (
                    <>
                      <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-xs">
                        <div className="flex justify-between text-slate-500"><span>Transfer amount</span><span>{inr(quote.amount)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Fee</span><span>{inr(quote.fee)}</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-navy-950"><span>Total deducted</span><span>{inr(quote.total)}</span></div>
                      </div>
                      <Field label="Customer OTP">
                        <input value={txnOtp} onChange={(e) => setTxnOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" className="field font-mono tracking-widest" required />
                      </Field>
                    </>
                  )}
                  <button type="submit" disabled={processing || numAmount <= 0} className="btn-primary w-full justify-center py-3.5 text-base">
                    {processing ? "Please wait..." : quote ? "Confirm transfer" : "Send OTP"}
                    {!processing && <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </button>
                  {quote && (
                    <button type="button" className="w-full text-xs font-semibold text-slate-500" onClick={() => setQuote(null)}>Change amount</button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={addBeneOpen}
        onClose={() => { setAddBeneOpen(false); resetBeneForm(); }}
        title={beneSession ? "Enter the customer OTP" : "Add recipient bank account"}
        description={beneSession ? "PaySprint sent an OTP to the customer's mobile." : "The customer confirms this account with an OTP."}
      >
        {!beneSession ? (
          <form onSubmit={handleBeneOtp} className="space-y-3 pt-2">
            <Field label="Beneficiary name">
              <input required value={beneName} onChange={(e) => setBeneName(e.target.value)} className="field" />
            </Field>
            <Field label="Bank account number">
              <input required value={beneAccount} onChange={(e) => setBeneAccount(e.target.value)} className="field font-mono" />
            </Field>
            <Field label="Bank IFSC code">
              <input required maxLength={11} value={beneIfsc} onChange={(e) => setBeneIfsc(e.target.value.toUpperCase())} className="field font-mono uppercase" />
            </Field>
            <Field label="Bank">
              <input
                required
                value={beneBank}
                onChange={(e) => { setBeneBank(e.target.value); setBeneBankId(""); }}
                placeholder="Search bank name or id"
                className="field"
              />
              {beneBankId && <p className="mt-1 text-xs text-emerald-700">Selected bank id {beneBankId}</p>}
              {!beneBankId && bankHits.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white">
                  {bankHits.map((bank) => (
                    <li key={bank.bank_id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => { setBeneBank(bank.bank_name); setBeneBankId(bank.bank_id); setBankHits([]); }}
                      >
                        <span>{bank.bank_name}</span>
                        <span className="font-mono text-xs text-slate-400">{bank.bank_id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
            <div className="flex justify-end pt-3">
              <button type="submit" disabled={addingBene || !beneBankId} className="btn-primary">{addingBene ? "Sending..." : "Send OTP"}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddBeneficiary} className="space-y-3 pt-2">
            <Field label="OTP from the customer">
              <input required value={beneOtp} onChange={(e) => setBeneOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" className="field font-mono tracking-widest" />
            </Field>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" className="btn-secondary" onClick={() => setBeneSession(null)}>Back</button>
              <button type="submit" disabled={addingBene || !beneOtp} className="btn-primary">{addingBene ? "Adding..." : "Add beneficiary"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function RemitterCard({ remitter, onRecheck, checking }: { remitter: Remitter; onRecheck: () => void; checking: boolean }) {
  if (remitter.status === "ACTIVE") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><User className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold text-navy-950">Customer account is active</p>
            <p className="font-mono text-xs text-slate-500">+91 {remitter.mobile}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Limit</span>
          <p className="text-sm font-bold text-emerald-700">{remitter.limit != null ? inr(remitter.limit) : "—"}</p>
        </div>
      </div>
    );
  }
  if (remitter.status === "NOT_FOUND") {
    return (
      <div className="space-y-3">
        <Alert tone="info">{remitter.message || "This customer does not have an account yet. Share the link so they can open one."}</Alert>
        {remitter.accountOpeningUrl && (
          <div className="flex gap-2">
            <input readOnly value={remitter.accountOpeningUrl} className="field font-mono text-xs" />
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1"
              onClick={() => navigator.clipboard.writeText(remitter.accountOpeningUrl || "")}
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        )}
        <button type="button" className="btn-primary" onClick={onRecheck} disabled={checking}>{checking ? "Checking..." : "Check again"}</button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <Alert tone="error">{remitter.message || "This customer cannot send money yet."}</Alert>
      {(remitter.rejections || []).map((item, index) => (
        <p key={index} className="text-sm text-slate-600">
          <span className="font-semibold">{item.RejectionType || "Update needed"}. </span>
          {item.Remarks}
        </p>
      ))}
      <button type="button" className="btn-secondary" onClick={onRecheck} disabled={checking}>{checking ? "Checking..." : "Check again"}</button>
    </div>
  );
}

function Receipt({
  receipt, pending, processing, refundReady, refundOtp, onRefundOtp, onCheck, onSendRefund, onClaim, onReset,
}: {
  receipt: Transfer;
  pending: boolean;
  processing: boolean;
  refundReady: boolean;
  refundOtp: string;
  onRefundOtp: (value: string) => void;
  onCheck: () => void;
  onSendRefund: () => void;
  onClaim: (e: FormEvent) => void;
  onReset: () => void;
}) {
  const success = receipt.state === "SUCCESS";
  return (
    <div className="space-y-6 rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-2xl sm:p-10">
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-display text-2xl font-bold text-navy-950">
          {success ? "Transfer successful" : pending ? "Transfer in progress" : "Transfer update"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{receipt.message || (success ? "Funds were sent to the recipient bank." : "Check again in a few minutes.")}</p>
        <p className="mt-4 font-display text-4xl font-extrabold text-emerald-600">{inr(receipt.amount)}</p>
        <p className="mt-1 text-xs text-slate-400">Fee {inr(receipt.fee)} · {receipt.transferMode}</p>
      </div>
      <div className="mx-auto max-w-md divide-y divide-slate-200/60 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm">
        <Row label="Transaction" value={receipt.transactionId} mono />
        <Row label="Reference" value={receipt.referenceId || "—"} mono />
        <Row label="UTR" value={receipt.utr || "—"} mono />
        <Row label="Ack no" value={receipt.ackno || "—"} mono />
        <Row label="Recipient" value={receipt.beneficiaryName || "—"} />
        <Row label="Account" value={receipt.accountMasked || "—"} mono />
        {receipt.providerCharge != null && <Row label="Provider charge" value={inr(receipt.providerCharge)} />}
        {receipt.providerGst != null && <Row label="GST" value={inr(receipt.providerGst)} />}
        {receipt.providerTds != null && <Row label="TDS" value={inr(receipt.providerTds)} />}
        {receipt.providerCommission != null && <Row label="Provider commission" value={inr(receipt.providerCommission)} />}
        <Row label="Status" value={`${receipt.state}${receipt.refundState && receipt.refundState !== "NONE" ? ` · ${receipt.refundState}` : ""}`} />
        {receipt.createdAt && <Row label="Time" value={when(receipt.createdAt)} />}
      </div>
      {receipt.refundState === "CLAIM_REQUIRED" && (
        <form onSubmit={onClaim} className="mx-auto max-w-md space-y-3">
          <Alert tone="info">The transfer failed and the amount is still held. Claim the refund with the customer's OTP.</Alert>
          {refundReady && (
            <Field label="Refund OTP">
              <input value={refundOtp} onChange={(e) => onRefundOtp(e.target.value.replace(/\D/g, "").slice(0, 8))} className="field font-mono" required />
            </Field>
          )}
          <div className="flex justify-center gap-2">
            {!refundReady ? (
              <button type="button" className="btn-primary" disabled={processing} onClick={onSendRefund}>Send refund OTP</button>
            ) : (
              <button type="submit" className="btn-primary" disabled={processing}>Claim refund</button>
            )}
          </div>
        </form>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {pending && <button type="button" className="btn-secondary" disabled={processing} onClick={onCheck}>{processing ? "Checking..." : "Check status"}</button>}
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold">
          <Printer className="h-4 w-4" /> Print
        </button>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white">
          <RotateCcw className="h-4 w-4" /> New transfer
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right text-navy-950 ${mono ? "font-mono" : "font-semibold"}`}>{value}</span>
    </div>
  );
}
