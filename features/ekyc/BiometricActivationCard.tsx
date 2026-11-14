"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Usb,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import {
  capture,
  deviceInfo,
  discover,
  RdError,
  readLocation,
  type DeviceInfo,
} from "@/features/ekyc/rd-service";
import type { CashActivationState } from "@/features/desk/DeskServices";

type InitiateBiometricResponse = {
  alreadyVerified: boolean;
  sessionId?: string;
  channelKey: string;
  wadh?: string;
  rdEnv?: string;
  allowPastedPid?: boolean;
  expiresAt?: string;
  message?: string;
};

export function BiometricActivationCard({
  activation,
  onActivated,
  compact = false,
}: {
  activation: CashActivationState;
  onActivated: (next: CashActivationState) => void;
  compact?: boolean;
}) {
  const token = useSession((s) => s.token);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [pastedPidXml, setPastedPidXml] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [showManualGps, setShowManualGps] = useState(false);

  const [stepText, setStepText] = useState<string | null>(null);
  const [detectedDevice, setDetectedDevice] = useState<DeviceInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pendingChannel =
    activation.channels.find((c) => !c.biometricVerified) ??
    (activation.pendingChannelKey
      ? {
          channelKey: activation.pendingChannelKey,
          terminalLabel: "Merchant Banking Terminal",
          biometricVerified: false,
          status: "BIOMETRIC_REQUIRED",
        }
      : null);

  async function logDeviceEvent(payload: {
    stage: string;
    port?: number;
    status: string;
    rdsId?: string;
    mi?: string;
    errCode?: string;
    detail?: string;
  }) {
    if (!token) return;
    try {
      await api("/api/v1/me/biometric/device-event", {
        token,
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      /* telemetry must never block biometric capture */
    }
  }

  async function handleTestScanner() {
    setBusy(true);
    setError(null);
    setStepText("Searching for connected L1 fingerprint scanner on 127.0.0.1:11100–11120…");
    try {
      const svc = await discover();
      const info = await deviceInfo(svc);
      setDetectedDevice(info);
      await logDeviceEvent({
        stage: "DEVICE_CHECK",
        port: info.port,
        status: "READY",
        rdsId: info.rdsId,
        mi: info.model,
        detail: `Serial ${info.serial || "unknown"}`,
      });
      setSuccessMsg(
        `Scanner ready: ${info.model || info.rdsId || "L1 RD Scanner"} (Port ${info.port}${info.serial ? ` · SN ${info.serial}` : ""}).`,
      );
    } catch (err) {
      if (err instanceof RdError) {
        await logDeviceEvent({
          stage: "DEVICE_CHECK",
          status: "FAILED",
          errCode: err.errCode || err.reason,
          detail: err.message,
        });
      }
      setError(err instanceof Error ? err.message : "Could not detect fingerprint scanner.");
    } finally {
      setStepText(null);
      setBusy(false);
    }
  }

  async function handleStartBiometric() {
    if (!token || !pendingChannel) return;
    if (!activation.hasFullAadhaar && aadhaarNumber.replace(/\D/g, "").length !== 12) {
      setError("Enter your 12-digit Aadhaar number before scanning your fingerprint.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Capture GPS coordinates
      setStepText("Step 1/4 · Reading outlet geo-location…");
      let coords: { latitude: string; longitude: string };
      if (manualLat.trim() && manualLng.trim()) {
        coords = { latitude: manualLat.trim(), longitude: manualLng.trim() };
      } else {
        try {
          coords = await readLocation();
        } catch (locErr) {
          setShowManualGps(true);
          throw locErr;
        }
      }

      // 2. Initiate server-side biometric session (returns WADH if required)
      setStepText("Step 2/4 · Initializing secure Aadhaar biometric session…");
      const initRes = await api<InitiateBiometricResponse>(
        `/api/v1/me/biometric/${encodeURIComponent(pendingChannel.channelKey)}/initiate`,
        {
          token,
          method: "POST",
          body: JSON.stringify({
            aadhaarNumber: activation.hasFullAadhaar ? undefined : aadhaarNumber.replace(/\D/g, ""),
          }),
        },
      );

      if (initRes.alreadyVerified) {
        const refreshed = await api<CashActivationState>("/api/v1/me/cash-activation?refresh=true", { token });
        window.dispatchEvent(new Event("gfin-biometric-updated"));
        window.dispatchEvent(new Event("gfin-verification-updated"));
        onActivated(refreshed);
        setSuccessMsg("Biometric verification is already active on your account.");
        return;
      }

      let pidXml = "";
      if (activation.allowPastedPid && pastedPidXml.trim()) {
        pidXml = pastedPidXml.trim();
      } else {
        // 3. Discover L1 RD Service & capture fingerprint
        setStepText("Step 3/4 · Place your finger firmly on the glowing fingerprint scanner…");
        const svc = await discover();
        const info = await deviceInfo(svc);
        setDetectedDevice(info);

        const cap = await capture(
          svc,
          initRes.rdEnv || activation.rdEnv || "P",
          initRes.wadh || "",
          info,
        );
        pidXml = cap.pidData;

        await logDeviceEvent({
          stage: "BIOMETRIC_CAPTURE",
          port: cap.port,
          status: "CAPTURED",
          rdsId: cap.rdsId,
          mi: cap.model,
          detail: `qScore=${cap.qScore} shape=${cap.shape} tookMs=${cap.tookMs}`,
        });
      }

      // 4. Submit captured PID XML to backend
      setStepText("Step 4/4 · Verifying Aadhaar biometric & activating cash services…");
      const updated = await api<CashActivationState>(
        `/api/v1/me/biometric/${encodeURIComponent(pendingChannel.channelKey)}/submit`,
        {
          token,
          method: "POST",
          body: JSON.stringify({
            sessionId: initRes.sessionId,
            pidXml,
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        },
      );

      setSuccessMsg("Biometric verification completed! UPI Cashout, AePS, and Settlement services are now unlocked.");
      window.dispatchEvent(new Event("gfin-biometric-updated"));
      window.dispatchEvent(new Event("gfin-verification-updated"));
      onActivated(updated);
    } catch (err) {
      if (err instanceof RdError) {
        await logDeviceEvent({
          stage: "BIOMETRIC_CAPTURE",
          status: "FAILED",
          errCode: err.errCode || err.reason,
          detail: `${err.shape ? `[${err.shape}] ` : ""}${err.message}`,
        });
      }
      setError(formatApiError(err, "Biometric verification could not be completed. Please try again."));
    } finally {
      setStepText(null);
      setBusy(false);
    }
  }

  if (!pendingChannel && activation.biometricVerified) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-navy-950">
              Merchant Biometric Verification Active
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Your Aadhaar biometric KYC is verified. UPI Cashout, AePS, and Settlement Payouts are enabled.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Biometric Verified
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-[2rem] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-white ${
        compact ? "p-5" : "p-6 sm:p-8"
      } shadow-sm space-y-6`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-950 text-emerald-400 shadow-sm">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
              One-Time Biometric KYC Required
            </span>
            <h2 className="mt-1.5 font-display text-xl font-bold text-navy-950">
              {activation.additionalBiometricAvailable
                ? "Complete Additional Terminal Biometric Verification"
                : "Complete Biometric Verification to Activate Cash & Payout Services"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Connect an STQC-certified L1 fingerprint scanner (Mantra MFS110 L1, Morpho MSO 1300 E3 L1, or Startek FM220 L1) and scan your Aadhaar-linked fingerprint to unlock UPI Cashout, AePS, and Bank Payouts.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleTestScanner}
          className="btn-secondary !py-2 !px-3.5 text-xs inline-flex items-center gap-1.5 shrink-0 self-start"
        >
          <Usb className="h-3.5 w-3.5 text-emerald-600" />
          Check Scanner
        </button>
      </div>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 1 · USB Scanner
              </span>
              <Usb className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-navy-950">Connect L1 Fingerprint Device</p>
            <p className="text-[11px] text-slate-500">
              Ensure Mantra, Morpho, or Startek RD Service is running on your device.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 2 · Location &amp; Identity
              </span>
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-navy-950">Allow Outlet Geo-Location</p>
            <p className="text-[11px] text-slate-500">
              {activation.hasFullAadhaar
                ? `Aadhaar ending in ${activation.aadhaarLast4 || "••••"} ready for verification.`
                : "Confirm your 12-digit Aadhaar number and browser GPS permission."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Step 3 · Biometric Auth
              </span>
              <Fingerprint className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-navy-950">Scan Finger &amp; Unlock Counter</p>
            <p className="text-[11px] text-slate-500">
              Instantly activates UPI QR Cashout, AePS Withdrawals, and Bank Payouts.
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {successMsg && <Alert tone="success">{successMsg}</Alert>}

      {detectedDevice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
          <span className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            Connected Scanner: {detectedDevice.model || detectedDevice.rdsId || "RD Service"} (Port {detectedDevice.port})
          </span>
          {detectedDevice.serial && (
            <span className="font-mono text-[11px] text-emerald-800">SN: {detectedDevice.serial}</span>
          )}
        </div>
      )}

      {!activation.hasFullAadhaar && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
          <label className="block text-xs font-bold text-navy-950">
            12-Digit Aadhaar Number <span className="text-rose-600">*</span>
            <input
              className="field mt-1.5 font-mono bg-white max-w-sm"
              inputMode="numeric"
              maxLength={12}
              placeholder={
                activation.aadhaarLast4
                  ? `12 digits ending in ${activation.aadhaarLast4}`
                  : "Enter your 12-digit Aadhaar number"
              }
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
          </label>
          <p className="text-[11px] text-slate-500">
            {activation.aadhaarLast4
              ? `Must match your verified KYC Aadhaar ending in ${activation.aadhaarLast4}.`
              : "Used strictly for UIDAI Registered Device biometric authentication."}
          </p>
        </div>
      )}

      {showManualGps && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
          <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-amber-700" />
            Browser location was blocked — allow location permission or enter your shop coordinates:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 max-w-md">
            <label className="text-xs font-medium text-slate-700">
              Latitude
              <input
                className="field mt-1 font-mono bg-white"
                placeholder="e.g. 12.9716"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Longitude
              <input
                className="field mt-1 font-mono bg-white"
                placeholder="e.g. 77.5946"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {activation.allowPastedPid && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Developer Sandbox · Paste Captured &lt;PidData&gt; XML (Optional)
            <textarea
              rows={3}
              className="field mt-1 font-mono text-xs bg-white"
              placeholder="<PidData>...</PidData>"
              value={pastedPidXml}
              onChange={(e) => setPastedPidXml(e.target.value)}
            />
          </label>
        </div>
      )}

      {stepText && (
        <div className="rounded-2xl bg-navy-950 text-white px-4 py-3.5 flex items-center gap-3 text-xs font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
          <span>{stepText}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>UIDAI L1 Registered Device · Zero biometric data stored on server</span>
        </div>

        <button
          type="button"
          disabled={busy || !pendingChannel}
          onClick={handleStartBiometric}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          {busy ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Scanning &amp; Verifying…
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4" />
              Scan Fingerprint &amp; Activate Services
            </>
          )}
        </button>
      </div>
    </div>
  );
}

