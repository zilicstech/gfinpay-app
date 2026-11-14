"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { homeFor, useSession } from "@/stores/session.store";

export default function DistributorActivatePage() {
  const user = useSession((s) => s.user);
  const loadProfile = useSession((s) => s.loadProfile);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function refreshStatus() {
    setBusy(true);
    try {
      const updated = await loadProfile();
      if (updated.status === "ACTIVE") {
        router.replace(homeFor(updated.userType, updated.status, updated.nextStep));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Distributor Onboarding
          </span>
          <h1 className="font-display text-3xl font-bold">Awaiting Admin Activation</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Your Aadhaar, PAN, live selfie, and security PIN are verified. A platform or hub administrator will review and activate your Master Distributor console shortly.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Identity KYC</p>
              <p className="mt-0.5 text-sm font-semibold text-navy-950">Verified via DigiLocker & PAN</p>
            </div>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Account Status</p>
              <p className="mt-0.5 text-sm font-semibold text-navy-950">{user.status || "PENDING"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Partner Code: <span className="font-mono font-bold text-navy-950">{user.code || "—"}</span>
          </div>
          <button
            type="button"
            onClick={refreshStatus}
            disabled={busy}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Checking…" : "Check Activation Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

