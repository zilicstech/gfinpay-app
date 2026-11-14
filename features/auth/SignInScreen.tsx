"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Phone,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { markActivity } from "@/lib/session-activity";
import { homeFor, useSession, useSessionHydrated } from "@/stores/session.store";
import { Logo } from "@/components/brand/Logo";
import { Alert } from "@/components/ui/primitives";

const OTP_VALIDITY_SECONDS = 300; // 5 minutes

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function SignInScreen({
  title,
  subtitle,
  panelTitle,
  panelBody,
}: {
  title: string;
  subtitle: string;
  panelTitle?: string;
  panelBody?: string;
  panel?: ReactNode;
}) {
  const router = useRouter();
  const { user, token, setAuth, loadProfile, bootstrapped } = useSession();
  const hydrated = useSessionHydrated();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [loginStep, setLoginStep] = useState<"CREDENTIALS" | "VERIFY_PIN" | "SET_PIN" | "VERIFY_OTP">("CREDENTIALS");
  const [stepUser, setStepUser] = useState<{ fullName?: string; maskedMobile?: string; role?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpExpiresAtMs, setOtpExpiresAtMs] = useState<number | null>(null);
  const [otpRemainingSeconds, setOtpRemainingSeconds] = useState(0);

  useEffect(() => {
    // Wait for the silent refresh so a reload does not briefly show the form to a signed-in user.
    if (hydrated && bootstrapped && token && user?.userType) {
      router.replace(homeFor(user.userType, user.status, user.nextStep));
    }
  }, [bootstrapped, hydrated, router, token, user]);

  useEffect(() => {
    if (loginStep !== "VERIFY_OTP" || !otpExpiresAtMs) {
      return;
    }
    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((otpExpiresAtMs - Date.now()) / 1000));
      setOtpRemainingSeconds(diff);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [loginStep, otpExpiresAtMs]);

  function closeModal() {
    setLoginStep("CREDENTIALS");
    setStepUser(null);
    setPin("");
    setNewPin("");
    setConfirmPin("");
    setOtp("");
    setPinError(null);
    setOtpExpiresAtMs(null);
    setOtpRemainingSeconds(0);
  }

  async function requestLoginOtp(fromModal: boolean) {
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError("Please enter your Mobile or User Code first to get an OTP.");
      return;
    }
    setError(null);
    setPinError(null);
    setOtpSending(true);
    try {
      const res = await api<{
        sent: boolean;
        fullName?: string;
        maskedMobile?: string;
        role?: string;
        expiresAt?: string;
        ttlSeconds?: number;
      }>("/api/v1/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ identifier: cleanIdentifier }),
      });

      setStepUser((prev) => ({
        fullName: res.fullName || prev?.fullName,
        maskedMobile: res.maskedMobile || prev?.maskedMobile,
        role: res.role || prev?.role,
      }));
      setOtp("");
      const targetMs = Date.now() + OTP_VALIDITY_SECONDS * 1000;
      setOtpExpiresAtMs(targetMs);
      setOtpRemainingSeconds(OTP_VALIDITY_SECONDS);
      setLoginStep("VERIFY_OTP");
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.error.message : "Could not send OTP";
      if (fromModal) {
        setPinError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setOtpSending(false);
    }
  }

  async function onSubmitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPinError(null);
    setBusy(true);
    try {
      const data = await api<{
        step?: "VERIFY_PIN" | "SET_PIN";
        hasPin?: boolean;
        fullName?: string;
        maskedMobile?: string;
        token?: string;
        role: string;
        expiresAt?: string;
        nextStep?: string;
      }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (data.step === "VERIFY_PIN") {
        setStepUser({ fullName: data.fullName, maskedMobile: data.maskedMobile, role: data.role });
        setPin("");
        setLoginStep("VERIFY_PIN");
        return;
      }

      if (data.step === "SET_PIN") {
        setStepUser({ fullName: data.fullName, maskedMobile: data.maskedMobile, role: data.role });
        setNewPin("");
        setConfirmPin("");
        setLoginStep("SET_PIN");
        return;
      }

      if (data.token && data.expiresAt) {
        setAuth(data.token, data.role, data.expiresAt);
        markActivity();
        const profile = await loadProfile();
        router.replace(homeFor(profile.userType, profile.status, profile.nextStep || data.nextStep));
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitPinModal(e: FormEvent) {
    e.preventDefault();
    setPinError(null);

    if (loginStep === "SET_PIN") {
      if (newPin.trim().length !== 6) {
        setPinError("Enter a 6-digit MPIN.");
        return;
      }
      if (newPin.trim() !== confirmPin.trim()) {
        setPinError("MPIN and confirmation do not match.");
        return;
      }
    } else if (loginStep === "VERIFY_PIN") {
      if (pin.trim().length !== 6) {
        setPinError("Enter your 6-digit MPIN.");
        return;
      }
    } else if (loginStep === "VERIFY_OTP") {
      if (otp.trim().length !== 6) {
        setPinError("Enter the 6-digit OTP.");
        return;
      }
    }

    setBusy(true);
    try {
      if (loginStep === "VERIFY_OTP") {
        const data = await api<{
          token?: string;
          role: string;
          expiresAt?: string;
          nextStep?: string;
        }>("/api/v1/auth/otp/verify", {
          method: "POST",
          body: JSON.stringify({
            identifier: identifier.trim(),
            otp: otp.trim(),
          }),
        });

        if (data.token && data.expiresAt) {
          setAuth(data.token, data.role, data.expiresAt);
          markActivity();
          const profile = await loadProfile();
          router.replace(homeFor(profile.userType, profile.status, profile.nextStep || data.nextStep));
        }
        return;
      }

      const payload: Record<string, string | undefined> = {
        identifier: identifier.trim(),
        password,
      };
      if (loginStep === "VERIFY_PIN") {
        payload.pin = pin.trim();
      } else if (loginStep === "SET_PIN") {
        payload.newPin = newPin.trim();
      }

      const data = await api<{
        token?: string;
        role: string;
        expiresAt?: string;
        nextStep?: string;
      }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.token && data.expiresAt) {
        setAuth(data.token, data.role, data.expiresAt);
        markActivity();
        const profile = await loadProfile();
        router.replace(homeFor(profile.userType, profile.status, profile.nextStep || data.nextStep));
      }
    } catch (err) {
      setPinError(
        err instanceof ApiClientError
          ? err.error.message
          : loginStep === "VERIFY_OTP"
            ? "Unable to verify OTP"
            : "Unable to verify MPIN",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2 overflow-hidden">
      {/* Left Branding Showcase with Centered Services Collage */}
      <section className="relative hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 p-8 xl:p-12 text-white overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg mx-auto">
          <Logo light compact />
        </div>

        <div className="relative z-10 my-auto py-6 w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {panelTitle || (
                <>
                  Turn your shop into a{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                    Digital Bank & ATM
                  </span>
                </>
              )}
            </h1>
            <p className="text-slate-300 text-xs xl:text-sm leading-relaxed max-w-md mx-auto">
              {panelBody || "Money transfers, bill payments, Aadhaar cash withdrawals, and credit cards at your counter."}
            </p>
          </div>

          <div className="relative w-full mx-auto">
            <div className="grid grid-cols-2 gap-3.5 xl:gap-4.5">
              <div className="space-y-3.5 xl:space-y-4.5 mt-5 sm:mt-7">
                <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-2 border-white/20 group">
                  <img
                    src="/hero/collage1.jpg"
                    alt="Money Transfer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-0.5">
                    <ArrowRight className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] xl:text-xs font-bold text-navy-950">DMT</span>
                  </div>
                </div>
                <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-2 border-white/20 group">
                  <img
                    src="/hero/collage2.jpg"
                    alt="Bill Payments"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-0.5">
                    <Receipt className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] xl:text-xs font-bold text-navy-950">Bill Payment</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 xl:space-y-4.5">
                <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-2 border-white/20 group">
                  <img
                    src="/hero/collage3.jpg"
                    alt="Credit Cards"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-0.5">
                    <CreditCard className="h-3 w-3 text-indigo-500" />
                    <span className="text-[10px] xl:text-xs font-bold text-navy-950">Credit Card</span>
                  </div>
                </div>
                <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-2 border-white/20 group">
                  <img
                    src="/hero/collage4.jpg"
                    alt="AePS ATM"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-100/50 flex items-center gap-1.5 transition-transform group-hover:-translate-y-0.5">
                    <Fingerprint className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] xl:text-xs font-bold text-navy-950">AePS ATM</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Right Login Form (Centered) */}
      <section className="flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-14">
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          <div className="lg:hidden flex justify-between items-center pb-2">
            <Logo compact />
            <Link href="/" className="text-xs text-slate-500 hover:text-navy-950 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">{title}</h2>
            <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
          </div>

          <form onSubmit={onSubmitCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mobile or User Code</span>
              </label>
              <input
                className="field tracking-wider"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                placeholder="Mobile number or GFIN code"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => requestLoginOtp(false)}
                  disabled={busy || otpSending}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                >
                  {otpSending && loginStep === "CREDENTIALS" ? "Sending OTP…" : "Get OTP"}
                </button>
              </div>
              <div className="relative">
                <input
                  className="field pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your account password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <Alert tone="error">{error}</Alert>}

            <button
              type="submit"
              className="btn-primary w-full shadow-lg shadow-emerald-500/25 !py-3.5 font-bold"
              disabled={busy || otpSending || !identifier || !password}
            >
              {busy && loginStep === "CREDENTIALS" ? "Validating…" : "Sign In to Terminal"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Have an onboarding invite link? Open the link shared on SMS or WhatsApp to verify your account.
            </p>
            <div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                <span>Become a partner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(loginStep === "VERIFY_PIN" || loginStep === "SET_PIN" || loginStep === "VERIFY_OTP") && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  {loginStep === "VERIFY_OTP" ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {loginStep === "SET_PIN"
                      ? "Set Your 6-Digit MPIN"
                      : loginStep === "VERIFY_OTP"
                        ? "Verify OTP to Sign In"
                        : "Enter 6-Digit MPIN"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {loginStep === "SET_PIN"
                      ? "Set a 6-digit security MPIN for your account before logging in."
                      : loginStep === "VERIFY_OTP"
                        ? "Enter the 6-digit OTP sent to your registered mobile number."
                        : "Enter your 6-digit security MPIN to continue to your dashboard."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-950"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-navy-950 truncate">
                  {stepUser?.fullName || identifier}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  {stepUser?.maskedMobile || identifier}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200 shrink-0">
                <Phone className="h-3 w-3" /> Registered Mobile
              </span>
            </div>

            {pinError && <Alert tone="error">{pinError}</Alert>}

            <form onSubmit={onSubmitPinModal} className="space-y-4">
              {loginStep === "VERIFY_PIN" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>6-Digit MPIN</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => requestLoginOtp(true)}
                      disabled={busy || otpSending}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                    >
                      {otpSending ? "Sending OTP…" : "Send OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      className="field pr-10 font-mono tracking-[0.35em] text-center text-lg"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPin(!showPin)}
                      tabIndex={-1}
                      aria-label={showPin ? "Hide MPIN" : "Show MPIN"}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {loginStep === "VERIFY_OTP" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>6-Digit OTP</span>
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                        otpRemainingSeconds > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {otpRemainingSeconds > 0 ? formatCountdown(otpRemainingSeconds) : "00:00 (Expired)"}
                    </span>
                  </div>

                  <input
                    className="field font-mono tracking-[0.35em] text-center text-lg"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                  />

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-slate-500">
                      {otpRemainingSeconds > 0
                        ? `OTP valid for ${formatCountdown(otpRemainingSeconds)}`
                        : "OTP has expired. You can request a new OTP now."}
                    </span>
                    <button
                      type="button"
                      onClick={() => requestLoginOtp(true)}
                      disabled={busy || otpSending || otpRemainingSeconds > 0}
                      className={`font-semibold transition ${
                        otpRemainingSeconds > 0
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {otpSending
                        ? "Sending OTP…"
                        : otpRemainingSeconds > 0
                          ? `Resend OTP (${formatCountdown(otpRemainingSeconds)})`
                          : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {loginStep === "SET_PIN" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>New 6-Digit MPIN</span>
                    </label>
                    <div className="relative">
                      <input
                        className="field pr-10 font-mono tracking-[0.3em]"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit MPIN"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPin(!showPin)}
                        tabIndex={-1}
                        aria-label={showPin ? "Hide MPIN" : "Show MPIN"}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Confirm 6-Digit MPIN</span>
                    </label>
                    <input
                      className="field font-mono tracking-[0.3em]"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Re-enter 6-digit MPIN"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Avoid predictable MPINs such as 123456, 654321, or repeated digits like 000000.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                  disabled={busy || otpSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 !py-3 font-bold"
                  disabled={
                    busy ||
                    otpSending ||
                    (loginStep === "VERIFY_PIN" && pin.length !== 6) ||
                    (loginStep === "VERIFY_OTP" && (otp.length !== 6 || otpRemainingSeconds === 0)) ||
                    (loginStep === "SET_PIN" && (newPin.length !== 6 || confirmPin.length !== 6))
                  }
                >
                  {busy
                    ? "Signing in…"
                    : loginStep === "SET_PIN"
                      ? "Set MPIN & Sign In"
                      : loginStep === "VERIFY_OTP"
                        ? "Verify OTP & Sign In"
                        : "Verify MPIN & Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
