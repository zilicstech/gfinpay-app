"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Fingerprint,
  IndianRupee,
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
  iin: string;
  name: string;
};

type AepsTxnView = {
  id: string;
  transactionId?: string | null;
  aepsType: "CASH_WITHDRAWAL" | "BALANCE_ENQUIRY" | "MINI_STATEMENT" | string;
  bankIin: string;
  bankName: string;
  customerMobile: string;
  aadhaarMasked: string;
  amount: number;
  bankRrn?: string | null;
  availableBalance?: number | null;
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

  const [mode, setMode] = useState<AepsMode>("CW");
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankIin, setBankIin] = useState("607152");
  const [aadhaar, setAadhaar] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [amount, setAmount] = useState("1000");
  const [consent, setConsent] = useState(true);

  const [history, setHistory] = useState<AepsTxnView[]>([]);
  const [receipt, setReceipt] = useState<AepsTxnView | null>(null);
  const [scanStage, setScanStage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerNote, setScannerNote] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const rows = await api<AepsTxnView[]>("/api/v1/aeps/history", { token });
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api<BankOption[]>("/api/v1/aeps/banks", { token })
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBanks(list);
          setBankIin((prev) => prev || list[0].iin);
        }
      })
      .catch(() => undefined);
    loadHistory();
  }, [token, loadHistory]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    const cleanAadhaar = aadhaar.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setError("Enter a valid 12-digit customer Aadhaar number.");
      return;
    }
    const cleanMob = customerMobile.replace(/\D/g, "");
    if (cleanMob.length !== 10) {
      setError("Enter a valid 10-digit customer mobile number.");
      return;
    }
    const amt = mode === "CW" ? Number(amount) : 0;
    if (mode === "CW" && (!Number.isInteger(amt) || amt < 100 || amt > 10000 || amt % 50 !== 0)) {
      setError("Cash Withdrawal amount must be between ₹100 and ₹10,000 in multiples of ₹50.");
      return;
    }
    if (!consent) {
      setError("Confirm customer Aadhaar biometric consent before scanning.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      setScanStage("Reading outlet location…");
      let coords: { latitude?: string; longitude?: string } = {};
      try {
        coords = await readLocation();
      } catch {
        /* falls back to stored shop GPS on server */
      }

      setScanStage("Connecting to L1 fingerprint scanner — ask customer to place finger…");
      const svc = await discover();
      const info = await deviceInfo(svc);
      const cap = await capture(svc, "P", "", info);

      setScanStage("Processing AePS transaction on NPCI banking switch…");
      const res = await api<AepsTxnView>("/api/v1/aeps/transact", {
        token,
        method: "POST",
        body: JSON.stringify({
          mode,
          aadhaarNumber: cleanAadhaar,
          bankIin,
          customerMobile: cleanMob,
          amount: mode === "CW" ? amt : 0,
          pidXml: cap.pidData,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      setReceipt(res);
      setAadhaar("");
      loadHistory();
      if (mode === "CW" && res.status === "SUCCESS") {
        loadProfile().catch(() => undefined);
      }
    } catch (err) {
      setError(formatApiError(err, "AePS transaction could not be completed"));
    } finally {
      setScanStage(null);
      setBusy(false);
    }
  }

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
                  onClick={() => setMode(id)}
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

          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Customer Bank <span className="text-rose-600">*</span>
              <select
                className="field mt-1"
                value={bankIin}
                onChange={(e) => setBankIin(e.target.value)}
                required
              >
                {banks.map((b) => (
                  <option key={b.iin} value={b.iin}>
                    {b.name} (IIN: {b.iin})
                  </option>
                ))}
              </select>
            </label>
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
                Withdrawal Amount (₹100 – ₹10,000)
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

          {scanStage && (
            <div className="rounded-2xl bg-navy-950 text-white px-4 py-3.5 flex items-center gap-3 text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
              <span>{scanStage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2"
          >
            <Fingerprint className="h-4 w-4" />
            {busy
              ? "Scanning & Submitting…"
              : mode === "CW"
                ? `Scan Customer Finger & Withdraw ${inr(Number(amount || 0))}`
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
                {history.slice(0, 10).map((item) => (
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
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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
              <div>
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
                  {receipt.miniStatement.map((entry, idx) => (
                    <div key={idx} className="px-3.5 py-2 flex items-center justify-between font-mono text-[11px]">
                      <span>{String(entry.date || entry.txnDate || "—")} · {String(entry.narration || entry.txnType || "")}</span>
                      <span className="font-bold">{String(entry.amount || "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
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
