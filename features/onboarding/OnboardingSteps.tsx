"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Alert } from "@/components/ui/primitives";
import { DigiboostButton } from "./DigiboostButton";

export type PermanentAddressData = {
  careOf?: string;
  house?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  vtc?: string;
  postOffice?: string;
  subDistrict?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  fullAddress?: string;
};

export type OnboardingIdentityData = {
  phoneVerified?: boolean;
  locationCaptured?: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  aadhaarVerified?: boolean;
  aadhaarName?: string;
  dob?: string;
  gender?: string;
  aadhaarLast4?: string;
  maskedAadhaar?: string;
  hasFullAadhaar?: boolean;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  permanentAddress?: PermanentAddressData;
  aadhaarLinked?: boolean;
  aadhaarPanLinked?: boolean;
  digilockerPanAvailable?: boolean;
  digilockerPanNumber?: string;
  panVerified?: boolean;
  panLast4?: string;
  panName?: string;
  panNameMatchScore?: number;
  panSource?: string;
  panMaskedAadhaar?: string;
  panAadhaarLast4?: string;
  panAadhaarLast4Match?: boolean;
  selfieVerified?: boolean;
  selfieCaptured?: boolean;
  faceReviewStatus?: string;
};

export type OnboardingJourneyState = {
  inviteId?: string;
  journeyId?: string;
  role: "RETAILER" | "MASTER_DISTRIBUTOR" | string;
  fullName: string;
  companyName?: string;
  cin?: string;
  din?: string;
  maskedMobile: string;
  hasPin?: boolean;
  currentStep: string;
  status: string;
  journeyStatus?: string;
  identity: OnboardingIdentityData;
  completed?: boolean;
  userCode?: string | null;
  requiresSessionOtp?: boolean;
};

export type OnboardingApiAdapter = {
  loadState: () => Promise<OnboardingJourneyState>;
  sendOtp: () => Promise<{ maskedMobile?: string; expiresAt?: string; cooldownSeconds?: number }>;
  verifyOtp: (otp: string) => Promise<OnboardingJourneyState>;
  saveLocation: (loc: { latitude: number; longitude: number; accuracy?: number }) => Promise<OnboardingJourneyState>;
  startDigilocker: () => Promise<{
    token: string;
    gateway: string;
    expiresAt: string;
    state: string;
    alreadyCompleted?: boolean;
  }>;
  completeDigilocker: (payload: { state: string }) => Promise<OnboardingJourneyState>;
  verifyPan: (pan: string, file?: Blob | File | null, aadhaar?: string) => Promise<OnboardingJourneyState>;
  verifySelfie: (file: Blob) => Promise<OnboardingJourneyState>;
  completeCredentials: (payload: { password?: string; pin: string }) => Promise<OnboardingJourneyState>;
};

const STEPS = [
  { id: "PHONE_OTP", label: "Phone OTP", icon: Phone },
  { id: "LOCATION", label: "Location", icon: MapPin },
  { id: "AADHAAR", label: "Aadhaar eKYC", icon: FileCheck2 },
  { id: "PAN", label: "PAN Check", icon: CreditCard },
  { id: "SELFIE", label: "Live Selfie", icon: Camera },
  { id: "CREDENTIALS", label: "Security PIN", icon: KeyRound },
] as const;

function activeStepIndex(state: OnboardingJourneyState, mode: "PUBLIC_INVITE" | "REVERIFY" | "SIGNATORY"): number {
  if (state.completed || state.status === "COMPLETED" || state.journeyStatus === "COMPLETED") {
    return 6;
  }
  const d = state.identity || {};
  if (!d.phoneVerified || state.requiresSessionOtp) return 0;
  if (!d.locationCaptured) return 1;
  if (!d.aadhaarVerified) return 2;
  if (!d.panVerified) return 3;
  if (!d.selfieVerified) return 4;
  if (mode === "SIGNATORY") return 6;
  return 5;
}

export function OnboardingWizardView({
  adapter,
  mode,
  onCompleted,
}: {
  adapter: OnboardingApiAdapter;
  mode: "PUBLIC_INVITE" | "REVERIFY" | "SIGNATORY";
  onCompleted: (state: OnboardingJourneyState) => void;
}) {
  const [state, setState] = useState<OnboardingJourneyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const digilockerHandled = useRef(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const next = await adapter.loadState();
      setState(next);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Unable to load onboarding session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading && !state) {
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        <div className="h-28 rounded-3xl bg-slate-200/70 animate-pulse" />
        <div className="h-80 rounded-3xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-navy-950">Onboarding Link Unavailable</h2>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const isNeedsReview = state.status === "NEEDS_REVIEW" || state.journeyStatus === "NEEDS_REVIEW";

  if (isNeedsReview) {
    return (
      <div className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="rounded-3xl bg-white border border-amber-200 p-6 sm:p-8 shadow-sm space-y-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            Manual Compliance Review
          </span>
          <h2 className="font-display text-2xl font-bold text-navy-950">
            Your verification is queued for review
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {error ||
              "We could not automatically match your KYC details after multiple attempts. Our compliance team has been notified and will review your profile shortly."}
          </p>
          <div className="pt-2">
            <button type="button" className="btn-secondary" onClick={refresh}>
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = activeStepIndex(state, mode);
  const visibleSteps = mode === "SIGNATORY" ? STEPS.slice(0, 5) : STEPS;

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              {mode === "REVERIFY"
                ? "Partner Re-Verification"
                : mode === "SIGNATORY"
                  ? "Authorized Signatory KYC"
                  : "Self-Service Onboarding"}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {mode === "SIGNATORY"
                ? state.companyName || state.cin || "Company Director"
                : state.role === "MASTER_DISTRIBUTOR"
                  ? "Master Distributor"
                  : "Retailer Outlet"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome, {state.identity?.aadhaarName || state.fullName}
          </h1>
          <p className="text-xs text-slate-300">
            Mobile: <span className="font-mono font-semibold text-white">{state.maskedMobile}</span>
            {mode === "SIGNATORY" && state.din ? ` · DIN: ${state.din}` : ""}
          </p>
        </div>

        {/* Stepper */}
        <ol className={`relative z-10 mt-5 grid gap-1.5 ${mode === "SIGNATORY" ? "grid-cols-5" : "grid-cols-6"}`}>
          {visibleSteps.map((s, idx) => {
            const Icon = s.icon;
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <li
                key={s.id}
                className={`flex flex-col items-center rounded-2xl p-2 text-center transition-all ${
                  done
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                    : active
                      ? "bg-white text-navy-950 shadow-md font-bold"
                      : "bg-white/5 text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Icon className="h-4 w-4" />}
                <span className="mt-1 text-[10px] leading-tight truncate w-full">{s.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Active Step Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        {currentIdx === 0 && (
          <PhoneOtpStep
            state={state}
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 1 && (
          <LocationStep
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 2 && (
          <DigilockerStep
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 3 && (
          <PanStep
            state={state}
            mode={mode}
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 4 && (
          <SelfieStep
            state={state}
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 5 && mode !== "SIGNATORY" && (
          <CredentialsStep
            state={state}
            mode={mode}
            adapter={adapter}
            onUpdated={(next) => {
              setError(null);
              setState(next);
            }}
            onError={setError}
          />
        )}

        {currentIdx === 6 && (
          <DoneStep
            state={state}
            mode={mode}
            onContinue={() => onCompleted(state)}
          />
        )}
      </div>
    </div>
  );
}

const OTP_VALIDITY_SECONDS = 300; // 5 minutes

function formatOtpCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function PhoneOtpStep({
  state,
  adapter,
  onUpdated,
  onError,
}: {
  state: OnboardingJourneyState;
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!sent || !expiresAtMs) return;
    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sent, expiresAtMs]);

  async function send() {
    setBusy(true);
    onError(null);
    setDevOtp(null);
    try {
      await adapter.sendOtp();
      setSent(true);
      setOtp("");
      setExpiresAtMs(Date.now() + OTP_VALIDITY_SECONDS * 1000);
      setRemainingSeconds(OTP_VALIDITY_SECONDS);
      api<{ found?: boolean; otp?: string }>("/api/v1/public/dev/last-otp")
        .then((d) => {
          if (d?.otp) setDevOtp(d.otp);
        })
        .catch(() => undefined);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.error.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      const next = await adapter.verifyOtp(otp.trim());
      onUpdated(next);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.error.message : "Invalid OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 1 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">Verify your mobile number</h2>
        <p className="mt-1 text-sm text-slate-500">
          We will send a 6-digit OTP to your registered mobile number{" "}
          <span className="font-mono font-semibold text-navy-950">{state.maskedMobile}</span>.
        </p>
      </div>

      {!sent ? (
        <button type="button" className="btn-primary w-full !py-3.5" disabled={busy} onClick={send}>
          {busy ? "Sending OTP…" : `Send OTP to ${state.maskedMobile}`}
        </button>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          {devOtp && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
              <span>
                Dev Mode OTP: <strong className="font-mono text-sm">{devOtp}</strong>
              </span>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="font-bold text-amber-800 underline"
              >
                Autofill
              </button>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Enter 6-Digit OTP
              </label>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                  remainingSeconds > 0
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <Clock className="h-3 w-3" />
                {remainingSeconds > 0 ? formatOtpCountdown(remainingSeconds) : "00:00 (Expired)"}
              </span>
            </div>
            <input
              className="field font-mono text-center text-xl tracking-[0.35em]"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={send}
              disabled={busy || remainingSeconds > 0}
              className={`text-xs font-semibold transition ${
                remainingSeconds > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              {remainingSeconds > 0 ? `Resend OTP (${formatOtpCountdown(remainingSeconds)})` : "Resend OTP"}
            </button>
            <button
              type="submit"
              className="btn-primary px-6"
              disabled={busy || otp.length !== 6 || remainingSeconds === 0}
            >
              {busy ? "Verifying…" : "Verify & Continue"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function LocationStep({
  adapter,
  onUpdated,
  onError,
}: {
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  function captureLocation() {
    setBusy(true);
    onError(null);
    if (!navigator.geolocation) {
      setBusy(false);
      onError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const next = await adapter.saveLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          onUpdated(next);
        } catch (err) {
          onError(err instanceof ApiClientError ? err.error.message : "Could not record location");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        onError("Please allow location permission in your browser to continue.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 2 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">Capture current GPS location</h2>
        <p className="mt-1 text-sm text-slate-500">
          Regulatory compliance requires geo-tagging the location where you complete your partner verification.
        </p>
      </div>
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3 text-xs text-slate-600">
        <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
        <span>Make sure location services are enabled on your device and click below to allow access.</span>
      </div>
      <button type="button" className="btn-primary w-full !py-3.5" disabled={busy} onClick={captureLocation}>
        {busy ? "Capturing GPS Coordinates…" : "Allow Location & Continue"}
      </button>
    </div>
  );
}

function DigilockerStep({
  adapter,
  onUpdated,
  onError,
}: {
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const [dlSession, setDlSession] = useState<{
    token: string;
    gateway: string;
    expiresAt: string;
    state: string;
    alreadyCompleted?: boolean;
  } | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const autoInitRef = useRef(false);
  const completingRef = useRef(false);

  async function completeWithState(stateToken: string) {
    if (completingRef.current) return;
    completingRef.current = true;
    setCompleting(true);
    onError(null);
    try {
      const next = await adapter.completeDigilocker({ state: stateToken });
      onUpdated(next);
    } catch (err) {
      onError(
        err instanceof ApiClientError
          ? err.error.message
          : "Failed to verify DigiLocker documents. Please ensure both Aadhaar and PAN are shared.",
      );
      adapter
        .loadState()
        .then(onUpdated)
        .catch(() => undefined);
    } finally {
      completingRef.current = false;
      setCompleting(false);
    }
  }

  async function initSession() {
    if (completingRef.current) return;
    setInitializing(true);
    onError(null);
    try {
      const res = await adapter.startDigilocker();
      setDlSession(res);
      if (res.alreadyCompleted && res.state) {
        await completeWithState(res.state);
      }
    } catch (err) {
      onError(
        err instanceof ApiClientError
          ? err.error.message
          : "Could not initialize DigiLocker session",
      );
    } finally {
      setInitializing(false);
    }
  }

  useEffect(() => {
    if (autoInitRef.current) return;
    autoInitRef.current = true;
    initSession();
  }, []);

  async function handleSdkSuccess() {
    if (!dlSession) return;
    await completeWithState(dlSession.state);
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 3 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
          Verify Aadhaar &amp; PAN via DigiLocker
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Authorize DigiLocker in the secure popup window to share your verified{" "}
          <strong>Aadhaar Card</strong> and <strong>PAN Verification Record</strong> for identity and
          permanent address compliance verification.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
        <div className="font-bold text-navy-950 flex items-center gap-1.5">
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
          DigiLocker Documents Checked:
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Aadhaar Card (UIDAI — Mandatory)</strong> — extracts verified name, DOB,
            photograph &amp; permanent address
          </li>
          <li>
            <strong>PAN Verification Record (Income Tax Dept)</strong> — if available in DigiLocker,
            your PAN will be autofilled automatically in the next step; otherwise you can enter and
            upload/capture your PAN card in Step 4
          </li>
        </ul>
      </div>

      {completing ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-sm font-semibold text-emerald-800">
          Validating &amp; encrypting your DigiLocker Aadhaar &amp; PAN documents…
        </div>
      ) : dlSession ? (
        <div className="space-y-3">
          <DigiboostButton
            token={dlSession.token}
            gateway={dlSession.gateway}
            disabled={initializing || completing}
            onSuccess={handleSdkSuccess}
            onFailure={(reason) => onError(reason)}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Popup didn&apos;t open or session timed out?</span>
            <button
              type="button"
              onClick={initSession}
              disabled={initializing}
              className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {initializing ? "Refreshing…" : "Refresh Session"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-primary w-full !py-3.5"
          disabled={initializing}
          onClick={initSession}
        >
          {initializing ? "Preparing DigiLocker Session…" : "Start DigiLocker Verification"}
        </button>
      )}
    </div>
  );
}

function formatAadhaarDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function PanStep({
  state,
  mode,
  adapter,
  onUpdated,
  onError,
}: {
  state: OnboardingJourneyState;
  mode: "PUBLIC_INVITE" | "REVERIFY" | "SIGNATORY";
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const hasDigilockerPan = Boolean(
    state.identity?.digilockerPanAvailable && state.identity?.digilockerPanNumber,
  );
  const autofilledPan = (state.identity?.digilockerPanNumber || "").trim().toUpperCase();
  const needsAadhaarInput = mode !== "SIGNATORY" && !state.identity?.hasFullAadhaar;
  const expectedLast4 = (state.identity?.aadhaarLast4 || "").replace(/\D/g, "");

  const [pan, setPan] = useState(autofilledPan);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [panFile, setPanFile] = useState<Blob | File | null>(null);
  const [panFileName, setPanFileName] = useState<string | null>(null);
  const [panPreviewUrl, setPanPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autofilledPan) {
      setPan(autofilledPan);
    }
  }, [autofilledPan]);

  useEffect(() => {
    return () => {
      stopPanCamera();
      if (panPreviewUrl) URL.revokeObjectURL(panPreviewUrl);
    };
  }, [panPreviewUrl]);

  function stopPanCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function startPanCamera() {
    onError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      onError("Camera permission is required to capture your PAN card photo.");
    }
  }

  function capturePanSnapshot() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 960;
    const h = video.videoHeight || 600;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (panPreviewUrl) URL.revokeObjectURL(panPreviewUrl);
        const file = new File([blob], "pan-camera.jpg", { type: "image/jpeg" });
        setPanFile(file);
        setPanFileName("Captured via Camera (pan-camera.jpg)");
        setPanPreviewUrl(URL.createObjectURL(blob));
        stopPanCamera();
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleFilePicked(file: File | null) {
    if (!file) return;
    stopPanCamera();
    if (panPreviewUrl) {
      URL.revokeObjectURL(panPreviewUrl);
      setPanPreviewUrl(null);
    }
    setPanFile(file);
    setPanFileName(file.name);
    if (file.type.startsWith("image/")) {
      setPanPreviewUrl(URL.createObjectURL(file));
    }
  }

  function clearPanFile() {
    stopPanCamera();
    if (panPreviewUrl) {
      URL.revokeObjectURL(panPreviewUrl);
      setPanPreviewUrl(null);
    }
    setPanFile(null);
    setPanFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const aadhaarDigits = aadhaarInput.replace(/\D/g, "").slice(0, 12);
  const aadhaarLast4Mismatch =
    needsAadhaarInput &&
    aadhaarDigits.length === 12 &&
    expectedLast4.length === 4 &&
    expectedLast4 !== "0000" &&
    !aadhaarDigits.endsWith(expectedLast4);
  const aadhaarValid = !needsAadhaarInput || (aadhaarDigits.length === 12 && !aadhaarLast4Mismatch);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const effectivePan = (hasDigilockerPan ? autofilledPan : pan).trim().toUpperCase();
    if (needsAadhaarInput) {
      if (aadhaarDigits.length !== 12) {
        onError("Please enter your complete 12-digit Aadhaar number.");
        return;
      }
      if (aadhaarLast4Mismatch) {
        onError(`Aadhaar number must end with ${expectedLast4} to match your DigiLocker verified Aadhaar.`);
        return;
      }
    }
    if (!hasDigilockerPan && !panFile) {
      onError("Please upload an image/PDF of your PAN card or capture a photo using your camera.");
      return;
    }
    setBusy(true);
    onError(null);
    try {
      const next = await adapter.verifyPan(
        effectivePan,
        hasDigilockerPan ? null : panFile,
        needsAadhaarInput ? aadhaarDigits : undefined,
      );
      onUpdated(next);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.error.message : "PAN verification failed");
      adapter.loadState().then(onUpdated).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  const permAddr = state.identity?.permanentAddress;
  const fullPermAddress = permAddr?.fullAddress || state.identity?.address;
  const effectivePanValue = hasDigilockerPan ? autofilledPan : pan;
  const canSubmit =
    aadhaarValid &&
    (hasDigilockerPan
      ? effectivePanValue.length === 10
      : effectivePanValue.length === 10 && Boolean(panFile));

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 4 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
          {needsAadhaarInput ? "Confirm 12-digit Aadhaar & verify PAN" : "Verify your PAN card"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {hasDigilockerPan ? (
            <>
              DigiLocker provides a masked Aadhaar for privacy. Enter your complete{" "}
              <strong>12-digit Aadhaar number</strong> and click{" "}
              <strong>Next</strong> to validate your autofilled PAN and Aadhaar-PAN linkage.
            </>
          ) : (
            <>
              PAN was not found in your DigiLocker. Enter your{" "}
              {needsAadhaarInput ? "complete 12-digit Aadhaar number, " : ""}10-character PAN number,
              and upload or capture a photo of your PAN card to validate against{" "}
              <span className="font-semibold text-navy-950">({state.identity?.aadhaarName})</span>.
            </>
          )}
        </p>
      </div>

      {state.identity?.aadhaarLast4 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center justify-between">
            <span>
              Aadhaar Verified: <strong>•••• {state.identity.aadhaarLast4}</strong>
            </span>
            <span>DOB: {state.identity.dob || "—"}</span>
          </div>
          {fullPermAddress && (
            <div className="pt-2 border-t border-emerald-200/70">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Permanent Address (from Aadhaar)
              </span>
              <p className="mt-0.5 text-xs text-emerald-900">{fullPermAddress}</p>
            </div>
          )}
        </div>
      )}

      {needsAadhaarInput && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Complete 12-Digit Aadhaar Number
            </label>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> KYC Verification
            </span>
          </div>
          <input
            className="field font-mono tracking-widest text-base"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            required
            value={formatAadhaarDisplay(aadhaarInput)}
            onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder={
              expectedLast4 && expectedLast4 !== "0000"
                ? `XXXX XXXX ${expectedLast4}`
                : "XXXX XXXX XXXX"
            }
          />
          {aadhaarLast4Mismatch ? (
            <p className="text-xs font-semibold text-rose-600">
              Last 4 digits must match your DigiLocker verified Aadhaar ending in •••• {expectedLast4}.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Must match your verified KYC Aadhaar ending in{" "}
              <strong className="font-mono text-navy-950">
                {expectedLast4 && expectedLast4 !== "0000" ? expectedLast4 : "your verified Aadhaar"}
              </strong>
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            10-Character PAN Number
          </label>
          {hasDigilockerPan ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Autofilled from DigiLocker
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              Manual PAN Entry Required
            </span>
          )}
        </div>
        <input
          className={`field font-mono uppercase tracking-widest text-base ${
            hasDigilockerPan ? "bg-slate-100 text-navy-950 font-bold cursor-not-allowed" : ""
          }`}
          maxLength={10}
          required
          readOnly={hasDigilockerPan}
          value={effectivePanValue}
          onChange={(e) => {
            if (!hasDigilockerPan) {
              setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10));
            }
          }}
          placeholder="ABCDE1234F"
        />
      </div>

      {!hasDigilockerPan && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-950 block">
                PAN Card Image / PDF (Required)
              </span>
              <span className="text-[11px] text-slate-500">
                Upload a clear photo/PDF of your PAN card or capture it using your camera
              </span>
            </div>
            {panFile && (
              <button
                type="button"
                onClick={clearPanFile}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFilePicked(e.target.files?.[0] || null)}
          />

          {cameraActive && (
            <div className="space-y-3">
              <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-950">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePanSnapshot}
                  className="btn-primary flex-1 !py-2.5 text-xs"
                >
                  Capture PAN Photo
                </button>
                <button
                  type="button"
                  onClick={stopPanCamera}
                  className="btn-secondary !py-2.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!cameraActive && panPreviewUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
              <img
                src={panPreviewUrl}
                alt="PAN card preview"
                className="max-h-48 w-full rounded-xl object-contain"
              />
            </div>
          )}

          {!cameraActive && panFileName && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
              <span className="truncate font-medium">{panFileName}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            </div>
          )}

          {!cameraActive && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary inline-flex items-center justify-center gap-1.5 !py-2.5 text-xs"
              >
                <Upload className="h-4 w-4" />
                {panFile ? "Change File" : "Upload PAN Image / PDF"}
              </button>
              <button
                type="button"
                onClick={startPanCamera}
                className="btn-secondary inline-flex items-center justify-center gap-1.5 !py-2.5 text-xs"
              >
                <Camera className="h-4 w-4" />
                {panFile ? "Retake with Camera" : "Capture with Camera"}
              </button>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn-primary w-full !py-3.5" disabled={busy || !canSubmit}>
        {busy
          ? "Validating PAN & Aadhaar Linkage…"
          : hasDigilockerPan
            ? "Next — Validate PAN & Continue"
            : "Verify PAN & Continue"}
      </button>
    </form>
  );
}

function SelfieStep({
  state,
  adapter,
  onUpdated,
  onError,
}: {
  state: OnboardingJourneyState;
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startCamera() {
    onError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      onError("Camera permission is required to capture a live selfie.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function takeSnapshot() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 640;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSnapshotBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  function retake() {
    setSnapshotBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    startCamera();
  }

  async function submitSelfie() {
    if (!snapshotBlob) return;
    setBusy(true);
    onError(null);
    try {
      const next = await adapter.verifySelfie(snapshotBlob);
      onUpdated(next);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.error.message : "Live selfie verification failed");
      adapter.loadState().then(onUpdated).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 5 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">Capture live selfie</h2>
        <p className="mt-1 text-sm text-slate-500">
          Take a clear, well-lit live photo of your face. Our compliance team will compare your live selfie against your Aadhaar photograph.
        </p>
      </div>

      {state.identity?.panLast4 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            PAN Verified: <strong>••••••{state.identity.panLast4}</strong>
          </span>
          <span>Name Match: {state.identity.panNameMatchScore ?? 100}%</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              state.identity.aadhaarPanLinked
                ? "bg-emerald-200/70 text-emerald-950"
                : "bg-amber-200/80 text-amber-950"
            }`}
          >
            Aadhaar-PAN: {state.identity.aadhaarPanLinked ? "Linked" : "Not Linked"}
          </span>
        </div>
      )}

      <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border-2 border-slate-200 bg-slate-950 grid place-items-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Captured selfie" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
          />
        )}
        {!cameraActive && !previewUrl && (
          <div className="text-center p-6 space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-emerald-400">
              <Camera className="h-7 w-7" />
            </div>
            <p className="text-xs text-slate-300">Position your face in the center of the frame</p>
            <button type="button" className="btn-primary text-xs" onClick={startCamera}>
              Open Front Camera
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {cameraActive && (
          <button type="button" className="btn-primary w-full !py-3.5" onClick={takeSnapshot}>
            Capture Photo
          </button>
        )}
        {previewUrl && (
          <>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5"
              disabled={busy}
              onClick={retake}
            >
              <RefreshCw className="h-4 w-4" /> Retake
            </button>
            <button
              type="button"
              className="btn-primary flex-1 !py-3"
              disabled={busy}
              onClick={submitSelfie}
            >
              {busy ? "Uploading Live Selfie…" : "Save Selfie & Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CredentialsStep({
  state,
  mode,
  adapter,
  onUpdated,
  onError,
}: {
  state: OnboardingJourneyState;
  mode: "PUBLIC_INVITE" | "REVERIFY";
  adapter: OnboardingApiAdapter;
  onUpdated: (next: OnboardingJourneyState) => void;
  onError: (msg: string | null) => void;
}) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  const requirePassword = mode === "PUBLIC_INVITE";
  const requirePin = mode === "PUBLIC_INVITE" || !state.hasPin;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    try {
      const next = await adapter.completeCredentials({
        password: password.trim() ? password : undefined,
        pin: pin.trim(),
      });
      onUpdated(next);
    } catch (err) {
      onError(err instanceof ApiClientError ? err.error.message : "Could not save credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 6 of 6</span>
        <h2 className="mt-1 font-display text-xl font-bold text-navy-950">
          {mode === "PUBLIC_INVITE"
            ? "Set your password & 6-digit MPIN"
            : requirePin
              ? "Set your 6-digit security MPIN"
              : "Confirm & Complete Verification"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {requirePin
            ? "Both your password and 6-digit security MPIN are required every time you sign in."
            : "Your Aadhaar, PAN, and live selfie have passed verification. Click below to finish, or optionally update your password/MPIN."}
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
          {requirePassword ? "Account Password" : "New Password (Optional — leave blank to keep current)"}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="field pr-10"
            required={requirePassword}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, at least one letter and one digit"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-600" />
          <span>{requirePin ? "6-Digit Login MPIN" : "New 6-Digit MPIN (Optional — leave blank to keep current)"}</span>
        </label>
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={6}
            required={requirePin}
            className="field pr-10 font-mono tracking-[0.3em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit numeric MPIN"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPin(!showPin)}
            tabIndex={-1}
          >
            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Do not use all identical digits (e.g. 000000) or sequential digits (123456).
        </p>
      </div>

      <button
        type="submit"
        className="btn-primary w-full !py-3.5"
        disabled={
          busy ||
          (requirePassword && password.length < 8) ||
          (requirePin && pin.length !== 6) ||
          (!requirePin && pin.length > 0 && pin.length !== 6)
        }
      >
        {busy ? "Completing Verification…" : "Complete Verification"}
      </button>
    </form>
  );
}

function DoneStep({
  state,
  mode,
  onContinue,
}: {
  state: OnboardingJourneyState;
  mode: "PUBLIC_INVITE" | "REVERIFY" | "SIGNATORY";
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5 text-center py-2">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Identity Verified</span>
        <h2 className="mt-1 font-display text-2xl font-bold text-navy-950">
          {mode === "REVERIFY"
            ? "Re-verification Complete!"
            : mode === "SIGNATORY"
              ? "Authorized Signatory KYC Complete!"
              : "Your partner account is ready!"}
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
          {mode === "REVERIFY"
            ? "Your Aadhaar, PAN, live selfie, and security PIN are verified. Sign in with your password and new 6-digit PIN to access your console."
            : mode === "SIGNATORY"
              ? `Thank you! Your identity KYC as Authorized Signatory${state.companyName ? ` for ${state.companyName}` : ""} has been submitted for admin review. You may now close this window.`
              : "Your Aadhaar, PAN, and live selfie have been verified. Sign in with your mobile number, password, and 6-digit PIN to complete activation."}
        </p>
      </div>

      {state.userCode && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Your Partner Code</span>
          <span className="mt-1 font-mono text-lg font-bold text-navy-950">{state.userCode}</span>
        </div>
      )}

      {mode !== "SIGNATORY" && (
        <button type="button" className="btn-primary w-full !py-3.5" onClick={onContinue}>
          Proceed to Sign In
        </button>
      )}
    </div>
  );
}
