"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, CheckCircle2, Clock, HandCoins, QrCode, RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { api, formatApiError } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

const DONE_MESSAGE = "ps-upi-cashout-done";

type CashoutSession = {
  id?: string;
  amount?: number;
  status: string;
  customerName?: string | null;
  customerMobile?: string | null;
  bankRrn?: string | null;
  ackno?: string | null;
  errCode?: string | null;
  errMsg?: string | null;
  payerName?: string | null;
  refid?: number | null;
};

function openPopup(): Window | null {
  const width = 460;
  const height = 760;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  return window.open(
    "about:blank",
    "ps_upi_cashout",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function UpiCashoutDesk() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const popupRef = useRef<Window | null>(null);

  const [busy, setBusy] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [session, setSession] = useState<CashoutSession | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [ekycReady, setEkycReady] = useState<boolean | null>(null);

  async function loadLatest() {
    if (!token) return;
    const row = await api<CashoutSession>("/api/v1/cashout/upi/latest", { token });
    if (!row.id || row.status === "NONE") {
      setSession((current) => (current?.status === "NONE" ? current : null));
      return;
    }
    setSession((current) => {
      if (row.id === dismissedId && current == null) return null;
      return row;
    });
  }

  useEffect(() => {
    if (!token) return;
    api<{ banks?: { bankName: string; needed: boolean; status: string }[] }>("/api/v1/me/ekyc", { token })
      .then((res) => {
        const bank6 = res.banks?.find((bank) => bank.bankName === "bank6");
        setEkycReady(!bank6?.needed || bank6.status === "SUCCESS");
      })
      .catch(() => setEkycReady(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadLatest().catch(() => {});
    // The desk rebuilds from the latest session whenever it is opened, including a same-tab return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data !== DONE_MESSAGE) return;
      setHosting(false);
      popupRef.current = null;
      loadLatest().catch(() => {});
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dismissedId]);

  useEffect(() => {
    if (!hosting) return;
    const timer = setInterval(() => {
      const popup = popupRef.current;
      if (popup && popup.closed) {
        setHosting(false);
        popupRef.current = null;
        loadLatest().catch(() => {});
      }
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosting, token, dismissedId]);

  useEffect(() => {
    if (!token || !session?.id) return;
    if (session.status !== "INITIATED" && session.status !== "AWAITING_PAYMENT") return;
    const interval = setInterval(() => {
      api<CashoutSession>(`/api/v1/cashout/upi/${session.id}`, { token })
        .then((next) => setSession(next))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [token, session?.id, session?.status]);

  async function startCashout() {
    const popup = openPopup();
    setBusy(true);
    flash.clear();
    try {
      const res = await api<{ url: string }>("/api/v1/cashout/upi/token", { token, method: "POST" });
      if (!res.url) {
        popup?.close();
        flash.fail(null, "PaySprint did not return a cash-out page");
        return;
      }
      setDismissedId(null);
      if (popup) {
        popup.location.href = res.url;
        popupRef.current = popup;
        setHosting(true);
      } else {
        window.location.assign(res.url);
      }
    } catch (err) {
      popup?.close();
      flash.fail(err, formatApiError(err, "Could not start the cash out"));
    } finally {
      setBusy(false);
    }
  }

  async function refreshFromBank() {
    if (!session?.id) return;
    setBusy(true);
    flash.clear();
    try {
      const next = await api<CashoutSession>(`/api/v1/cashout/upi/${session.id}/refresh`, { token, method: "POST" });
      setSession(next);
    } catch (err) {
      flash.fail(err, formatApiError(err, "Could not refresh the cash out"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCashDispensed() {
    if (!session?.id) return;
    setBusy(true);
    flash.clear();
    try {
      const next = await api<CashoutSession>(`/api/v1/cashout/upi/${session.id}/dispense`, { token, method: "POST" });
      setSession(next);
    } catch (err) {
      flash.fail(err, formatApiError(err, "Could not record the cash handover"));
    } finally {
      setBusy(false);
    }
  }

  function startAgain() {
    setDismissedId(session?.id ?? null);
    setSession(null);
    flash.clear();
  }

  if (ekycReady === false) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
        <h1 className="font-display text-2xl font-bold text-navy-950">Finish cash out eKYC first</h1>
        <p className="mt-2 text-sm text-slate-600">Cash out stays closed until the bank accepts the fingerprint scan.</p>
        <Link href="/agent/kyc" className="mt-4 inline-block rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white">
          Open eKYC
        </Link>
      </div>
    );
  }

  const waiting = session?.status === "INITIATED" || session?.status === "AWAITING_PAYMENT";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <QrCode className="h-4 w-4" />
            UPI Instant Cashout Terminal
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">UPI to Cash Withdrawal</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            The customer finishes fingerprint check and UPI payment in a window over this page. Hand over cash only after the payment shows here.
          </p>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {hosting && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-navy-950/10 bg-navy-950 px-5 py-4 text-white sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Finish in the PaySprint window</p>
            <p className="mt-1 text-sm text-slate-300">This page updates as soon as the payment is confirmed.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => popupRef.current?.focus()}>
            Show the window
          </button>
        </div>
      )}

      {!session ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">New Cashout</span>
                <h3 className="text-xl font-bold text-navy-950">Start a cash out</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Amount, customer mobile, and the fingerprint check are collected by PaySprint. This page stays open behind that window.
                </p>
              </div>
              <button
                type="button"
                onClick={startCashout}
                disabled={busy || ekycReady !== true}
                className="btn-primary w-full justify-center py-4 text-base"
              >
                {busy ? "Opening cash out…" : "Start UPI cash out"}
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-navy-950">How UPI Cashout Works</h3>
              <ol className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">1</span>
                  <span>Start the cash out. A PaySprint window opens over this page.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">2</span>
                  <span>The customer completes the fingerprint check and pays the QR in that window.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">3</span>
                  <span>This page shows the amount once payment is confirmed. Count the cash and hand it over.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative space-y-8 overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-2xl sm:p-10">
          {waiting && (
            <div className="mx-auto max-w-lg space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-500/30">
                <Clock className="h-3.5 w-3.5" />
                {session.status === "INITIATED" ? "Waiting for the customer" : "QR is live, waiting for payment"}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-navy-950">
                  {session.amount != null ? inr(session.amount) : "Cash out in progress"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {session.customerName || "Customer"}{session.customerMobile ? ` · +91 ${session.customerMobile}` : ""}
                </p>
              </div>
              <button type="button" onClick={refreshFromBank} disabled={busy} className="btn-secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh from bank
              </button>
            </div>
          )}

          {session.status === "PAID" && (
            <div className="mx-auto max-w-lg space-y-6 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Payment Received
                </span>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-navy-950">
                  {inr(session.amount || 0)} credited to wallet
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {session.bankRrn ? `Bank reference ${session.bankRrn}` : session.payerName || "Payment confirmed"}
                </p>
              </div>
              <div className="space-y-4 rounded-3xl border-2 border-emerald-500 bg-emerald-50/50 p-6 text-left">
                <div className="flex items-center gap-3 text-emerald-950">
                  <HandCoins className="h-8 w-8 shrink-0 text-emerald-600" />
                  <div>
                    <h4 className="text-base font-bold">Counter handover</h4>
                    <p className="text-xs text-emerald-800">Count and hand over this cash now.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-white p-4">
                  <span className="text-sm font-semibold text-slate-700">Cash to hand over</span>
                  <span className="font-display text-2xl font-bold text-navy-950">{inr(session.amount || 0)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={confirmCashDispensed}
                disabled={busy}
                className="btn-primary w-full justify-center py-4 text-base shadow-xl shadow-emerald-600/30"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirm cash handed over
              </button>
            </div>
          )}

          {session.status === "CASH_DISPENSED" && (
            <div className="mx-auto max-w-lg space-y-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-navy-950">Cash out completed</h2>
                <p className="mt-3 font-display text-4xl font-extrabold text-emerald-600">{inr(session.amount || 0)}</p>
              </div>
              <div className="divide-y divide-slate-200/60 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-navy-950">{session.refid ?? session.ackno ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Bank RRN</span>
                  <span className="font-mono font-bold text-emerald-700">{session.bankRrn || "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-navy-950">{session.customerName || "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Status</span>
                  <StatusPill value="SUCCESS" label="CASH DISPENSED" />
                </div>
              </div>
              <button type="button" onClick={startAgain} className="btn-primary">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Start new cash out
              </button>
            </div>
          )}

          {(session.status === "FAILED" || session.status === "EXPIRED") && (
            <div className="mx-auto max-w-md space-y-4 py-8 text-center">
              <Banknote className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="font-display text-xl font-bold text-navy-950">
                {session.status === "EXPIRED" ? "QR expired" : "Cash out did not complete"}
              </h3>
              <p className="text-sm text-slate-500">{session.errMsg || "No payment was received, so the wallet was not credited."}</p>
              <button type="button" onClick={startAgain} className="btn-primary mt-2">
                Start again
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
