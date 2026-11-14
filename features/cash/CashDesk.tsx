"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Fingerprint, Lock, QrCode, RefreshCw } from "lucide-react";
import { formatApiError } from "@/lib/api-client";
import { Alert } from "@/components/ui/primitives";
import { useDeskServices, type CashActivationState } from "@/features/desk/DeskServices";
import { BiometricActivationCard } from "@/features/ekyc/BiometricActivationCard";
import { UpiCashoutDesk } from "@/features/cashout/UpiCashoutDesk";
import { AepsDesk } from "@/features/aeps/AepsDesk";

export function CashDesk({ defaultTab = "UPI" }: { defaultTab?: "UPI" | "AEPS" }) {
  const { cashActivation, refreshCashActivation } = useDeskServices();
  const [activation, setActivation] = useState<CashActivationState | null>(cashActivation);
  const [tab, setTab] = useState<"UPI" | "AEPS">(defaultTab);
  const [checking, setChecking] = useState(true);
  const [showExtraBiometric, setShowExtraBiometric] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 3: Live check whenever retailer visits the "Cash" page
  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    refreshCashActivation(true)
      .then((next) => {
        if (!cancelled && next) {
          setActivation(next);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(formatApiError(e, "Could not verify cash service activation"));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshCashActivation]);

  useEffect(() => {
    if (cashActivation) {
      setActivation(cashActivation);
    }
  }, [cashActivation]);

  async function handleManualRefresh() {
    setChecking(true);
    setError(null);
    const next = await refreshCashActivation(true);
    if (next) setActivation(next);
    setChecking(false);
  }

  if (checking && !activation) {
    return <div className="card h-64 animate-pulse bg-[#f5f5f5]" />;
  }

  if (error && !activation) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (!activation) {
    return null;
  }

  // Gate 1: Business Verification + Signed Agreement
  if (!activation.servicesUnlocked) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">Cash Counter</h1>
          <p className="mt-1 text-sm text-slate-500">UPI to Cashout &amp; AePS Banking Services</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-800 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy-950">
                Complete Business Verification &amp; Partner Agreement
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Cash services activate once your Business Registration is verified and your Master Service Agreement is signed.
              </p>
            </div>
          </div>
          <Link
            href={
              !activation.businessVerified
                ? "/agent/profile?tab=business"
                : "/agent/profile?tab=agreement"
            }
            className="btn-primary inline-flex items-center gap-2 text-xs"
          >
            {!activation.businessVerified ? "Complete Business Registration" : "Sign Partner Agreement"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Gate 2: Admin Provisioning of Merchant Terminal
  if (!activation.terminalProvisioned) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">Cash Counter</h1>
            <p className="mt-1 text-sm text-slate-500">UPI to Cashout &amp; AePS Banking Services</p>
          </div>
          <button
            type="button"
            disabled={checking}
            onClick={handleManualRefresh}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            Check Activation Status
          </button>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-800 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy-950">
                Merchant Cash Terminal Activation in Progress
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Your Business &amp; Master Service Agreement are verified! Compliance is provisioning your merchant banking terminal. Once enabled, you will be prompted here to complete your one-time fingerprint verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gate 3: White-Label Biometric KYC Required before Cashout & Payout unlock
  if (!activation.cashServicesActive || activation.biometricRequired) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              Terminal Activation
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-navy-950">Cash Counter</h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete your one-time Aadhaar biometric verification below to start accepting UPI Cashout &amp; AePS transactions.
            </p>
          </div>
          <button
            type="button"
            disabled={checking}
            onClick={handleManualRefresh}
            className="btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>

        <BiometricActivationCard activation={activation} onActivated={setActivation} />
      </div>
    );
  }

  // Step 4: Biometric Verified -> Both UPI Cashout & AePS Active!
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Biometric Active · Live Counter
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-navy-950">
            Cash Services Counter
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Accept walk-in customer UPI QR cashouts or Aadhaar biometric AePS withdrawals directly into your wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab("UPI")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "UPI" ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              UPI to Cashout
            </button>
            <button
              type="button"
              onClick={() => setTab("AEPS")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                tab === "AEPS" ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              AePS Banking
            </button>
          </div>
        </div>
      </div>

      {activation.additionalBiometricAvailable && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-950">
              An additional high-availability banking channel is available for your counter. Complete quick fingerprint verification to enable automatic failover.
            </p>
            <button
              type="button"
              onClick={() => setShowExtraBiometric((v) => !v)}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              {showExtraBiometric ? "Hide" : "Verify Additional Channel"}
            </button>
          </div>
          {showExtraBiometric && (
            <BiometricActivationCard
              activation={activation}
              onActivated={(next) => {
                setActivation(next);
                setShowExtraBiometric(false);
              }}
              compact
            />
          )}
        </div>
      )}

      {tab === "UPI" ? <UpiCashoutDesk embedded /> : <AepsDesk embedded />}
    </div>
  );
}
