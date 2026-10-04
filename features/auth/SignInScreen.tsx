"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Phone,
  Receipt,
  Sparkles,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { homeFor, useSession, useSessionHydrated } from "@/stores/session.store";
import { Logo } from "@/components/brand/Logo";
import { Alert } from "@/components/ui/primitives";

export function SignInScreen({
  title,
  subtitle,
  panelTitle,
  panelBody,
  panel,
}: {
  title: string;
  subtitle: string;
  panelTitle?: string;
  panelBody?: string;
  panel?: ReactNode;
}) {
  const router = useRouter();
  const { user, token, setAuth } = useSession();
  const hydrated = useSessionHydrated();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && token && user?.userType) router.replace(homeFor(user.userType));
  }, [hydrated, router, token, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ token: string; role: string; expiresAt: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setAuth(data.token, data.role, data.expiresAt);
      router.replace(homeFor(data.role));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2 overflow-hidden">
      {/* Left Branding Showcase with Centered Services Collage */}
      <section className="relative hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 p-8 xl:p-12 text-white overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Top bar with Logo */}
        <div className="relative z-10 w-full max-w-lg mx-auto">
          <Logo light compact />
        </div>

        {/* Center: Title & Perfectly Centered Collage */}
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

          {/* Collage of all services (centered) */}
          <div className="relative w-full mx-auto">
            <div className="grid grid-cols-2 gap-3.5 xl:gap-4.5">
              {/* Column 1 - Offset down */}
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

              {/* Column 2 */}
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
            {/* Ambient decorative glow behind collage */}
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

          <form onSubmit={onSubmit} className="space-y-4">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <span>Password</span>
              </label>
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
              disabled={busy || !identifier || !password}
            >
              {busy ? "Signing in…" : "Sign In to Terminal"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Need counter access or forgot credentials? Contact your Master Distributor or platform operations.
            </p>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Gfinpay Homepage</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
