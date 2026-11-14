"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";

const TRIVIAL_PINS = new Set([
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
  "654321",
  "012345",
  "543210",
  "112233",
  "121212",
  "123123",
]);

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function ChangePinCard({
  onSuccess,
  onError,
}: {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  const updateUser = useSession((s) => s.updateUser);

  const hasExistingPin = user?.hasPin !== false;
  const [usePasswordProof, setUsePasswordProof] = useState(!hasExistingPin);
  const [currentPin, setCurrentPin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localOk, setLocalOk] = useState<string | null>(null);

  const verifyWithPassword = !hasExistingPin || usePasswordProof;

  function reportError(message: string) {
    setLocalOk(null);
    if (onError) {
      onError(message);
    } else {
      setLocalError(message);
    }
  }

  function reportSuccess(message: string) {
    setLocalError(null);
    if (onSuccess) {
      onSuccess(message);
    } else {
      setLocalOk(message);
    }
  }

  async function submitPin(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setLocalOk(null);

    if (verifyWithPassword) {
      if (!currentPassword) {
        reportError("Enter your current account password to verify this change.");
        return;
      }
    } else if (currentPin.length !== 6) {
      reportError("Enter your current 6-digit security PIN.");
      return;
    }

    if (newPin.length !== 6) {
      reportError("New PIN must be an exact 6-digit number.");
      return;
    }
    if (TRIVIAL_PINS.has(newPin)) {
      reportError("Choose a less predictable 6-digit PIN (avoid 123456 or repeated digits).");
      return;
    }
    if (!verifyWithPassword && currentPin === newPin) {
      reportError("New PIN must be different from your current PIN.");
      return;
    }
    if (newPin !== confirmPin) {
      reportError("New 6-digit PIN and confirmation PIN do not match.");
      return;
    }

    setBusy(true);
    try {
      await api("/api/v1/me/pin", {
        token,
        method: "POST",
        body: JSON.stringify({
          currentPin: verifyWithPassword ? undefined : currentPin,
          currentPassword: verifyWithPassword ? currentPassword : undefined,
          newPin,
        }),
      });
      setCurrentPin("");
      setCurrentPassword("");
      setNewPin("");
      setConfirmPin("");
      setUsePasswordProof(false);
      updateUser({ hasPin: true });
      reportSuccess("6-digit security PIN updated successfully.");
    } catch (err) {
      reportError(formatApiError(err, "Could not update 6-digit PIN"));
    } finally {
      setBusy(false);
    }
  }

  const pinsMismatch = confirmPin.length === 6 && newPin.length === 6 && confirmPin !== newPin;
  const pinsMatch = confirmPin.length === 6 && newPin.length === 6 && confirmPin === newPin;

  return (
    <form
      onSubmit={submitPin}
      className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5"
    >
      <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            Security PIN (6-Digit MPIN)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Update the 6-digit security PIN required as your second factor during sign-in.
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            hasExistingPin
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
          }`}
        >
          {hasExistingPin ? "PIN Active" : "Set PIN"}
        </span>
      </div>

      {localError && <Alert tone="error">{localError}</Alert>}
      {localOk && <Alert tone="success">{localOk}</Alert>}

      <div className="space-y-4">
        {verifyWithPassword ? (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Account Password
              </label>
              {hasExistingPin && (
                <button
                  type="button"
                  onClick={() => {
                    setUsePasswordProof(false);
                    setCurrentPassword("");
                    setShowCurrent(false);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Verify with current PIN instead
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter your account password"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowCurrent((v) => !v)}
                tabIndex={-1}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Current 6-Digit PIN
              </label>
              <button
                type="button"
                onClick={() => {
                  setUsePasswordProof(true);
                  setCurrentPin("");
                  setShowCurrent(false);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Forgot PIN? Use password
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showCurrent ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(digitsOnly(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-mono font-bold tracking-[0.25em] text-navy-950 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter current 6-digit PIN"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowCurrent((v) => !v)}
                tabIndex={-1}
                aria-label={showCurrent ? "Hide current PIN" : "Show current PIN"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            New 6-Digit PIN
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showNew ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={newPin}
              onChange={(e) => setNewPin(digitsOnly(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-mono font-bold tracking-[0.25em] text-navy-950 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="6 digits (avoid 123456 / 111111)"
            />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
              aria-label={showNew ? "Hide new PIN" : "Show new PIN"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Confirm New 6-Digit PIN
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showConfirm ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(digitsOnly(e.target.value))}
              className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-10 text-sm font-mono font-bold tracking-[0.25em] text-navy-950 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                pinsMismatch
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                  : pinsMatch
                    ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              }`}
              placeholder="Re-enter new 6-digit PIN"
            />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide confirm PIN" : "Show confirm PIN"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pinsMismatch && (
            <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
              Confirmation PIN does not match the new 6-digit PIN.
            </p>
          )}
          {pinsMatch && (
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 6-digit PIN matched
            </p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={
            busy ||
            newPin.length !== 6 ||
            confirmPin.length !== 6 ||
            pinsMismatch ||
            (verifyWithPassword ? !currentPassword : currentPin.length !== 6)
          }
          className="w-full rounded-2xl bg-navy-950 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-navy-900 transition-colors disabled:opacity-50"
        >
          {busy ? "Updating PIN…" : hasExistingPin ? "Update 6-Digit PIN" : "Set 6-Digit PIN"}
        </button>
      </div>
    </form>
  );
}

