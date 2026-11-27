"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Lock, PowerOff, RefreshCw } from "lucide-react";
import { formatApiError } from "@/lib/api-client";
import { Alert } from "@/components/ui/primitives";
import { useDeskServices, type CashActivationState } from "@/features/desk/DeskServices";
import { BiometricActivationCard } from "@/features/ekyc/BiometricActivationCard";
import { UpiCashoutDesk } from "@/features/cashout/UpiCashoutDesk";

export function CashDesk() {
  const { codes, cashActivation, refreshCashActivation } = useDeskServices();
  const [activation, setActivation] = useState<CashActivationState | null>(cashActivation);
  const [checking, setChecking] = useState(true);
  const [showExtraBiometric, setShowExtraBiometric] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setError(formatApiError(e, "Could not verify UPI Cashpoint activation"));
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

  // Gate 0: Platform Service Rail Enabled in Admin Settings
  const serviceEnabled = activation.upiServiceEnabled !== false && codes.has("UPI_CASHOUT");
  if (!serviceEnabled) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">UPI Cashpoint</h1>
          <p className="mt-1 text-sm text-slate-500">Dynamic UPI QR Cash-Out Counter</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 flex items-start gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200/80 text-slate-700 shrink-0">
            <PowerOff className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy-950">
              UPI Cashpoint Is Currently Disabled
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              This service rail has been paused in Platform Settings. Please check back shortly or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Gate 1: Business Verification + Signed Agreement
  if (!activation.servicesUnlocked) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200/80 pb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">UPI Cashpoint</h1>
          <p className="mt-1 text-sm text-slate-500">Dynamic UPI QR Cash-Out Counter</p>
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
                UPI Cashpoint activates once your Business Registration is verified and your Master Service Agreement is signed.
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

  const upiProvisioned = activation.upiTerminalProvisioned ?? activation.terminalProvisioned;
  const upiBioRequired =
    activation.upiBiometricRequired ?? (!activation.upiCashoutActive && activation.biometricRequired);

  // Gate 2: Admin Provisioning of UPI Cashpoint Terminal
  if (!upiProvisioned) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-950">UPI Cashpoint</h1>
            <p className="mt-1 text-sm text-slate-500">Dynamic UPI QR Cash-Out Counter</p>
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
                UPI Cashpoint Terminal Activation in Progress
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Your Business &amp; Master Service Agreement are verified! Compliance is provisioning your UPI Cashpoint terminal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gate 3: White-Label Biometric KYC Required on UPI Channel (if required by provider)
  if (!activation.upiCashoutActive || upiBioRequired) {
    const scopedActivation: CashActivationState = {
      ...activation,
      pendingChannelKey: activation.upiPendingChannelKey ?? activation.pendingChannelKey,
    };
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              Terminal Activation
            </span>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-navy-950">UPI Cashpoint</h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete your one-time Aadhaar biometric verification below to start accepting UPI Cashpoint QR payments.
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

        <BiometricActivationCard activation={scopedActivation} onActivated={setActivation} />
      </div>
    );
  }

  // Gate 4: Active UPI Cashpoint Counter
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Counter
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-navy-950">
            UPI Cashpoint
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Generate walk-in dynamic UPI QR codes and receive instant wallet credit upon customer scan.
          </p>
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

      <UpiCashoutDesk embedded />
    </div>
  );
}
