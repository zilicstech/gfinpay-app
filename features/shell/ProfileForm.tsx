"use client";

import { FormEvent, useEffect, useState } from "react";
import { 
  Building2, 
  Copy, 
  KeyRound, 
  Lock, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  User as UserIcon,
  CheckCircle2
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { mapMeProfile, useSession, type MeProfile } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { maskMobile } from "@/lib/format";

export function ProfileForm() {
  const { token, user, setProfile } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shop, setShop] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.fullName ?? "");
    setEmail(user.email ?? "");
    setShop(user.shopName ?? "");
  }, [user]);

  async function copyMobile() {
    if (!user?.mobile) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 1600);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const p = await api<MeProfile>("/api/v1/me", {
        token,
        method: "PATCH",
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim() || null,
          shopName: user?.userType === "RETAILER" ? shop : undefined,
        }),
      });
      setProfile(mapMeProfile(p));
      setOk("Profile updated successfully.");
    } catch (err) {
      setError(formatApiError(err, "Could not save profile"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      await api("/api/v1/me/password", {
        token,
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setOk("Password updated successfully.");
    } catch (err) {
      setError(formatApiError(err, "Could not change password"));
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="card h-64 animate-pulse bg-slate-50" />;
  }

  const initials = (user.fullName ?? "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <div className="space-y-8">
      {/* Identity Hero Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="grid h-18 w-18 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl font-black text-navy-950 shadow-lg shadow-emerald-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {user.fullName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {user.userType}
                  </span>
                  <StatusPill value="ACTIVE" />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                  {user.code && (
                    <>
                      <span className="font-mono text-emerald-400 font-bold tracking-widest">{user.code}</span>
                      <span className="text-slate-500">·</span>
                    </>
                  )}
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {maskMobile(user.mobile ?? "")}
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label={copiedMobile ? "Mobile copied" : "Copy mobile"}
                      onClick={copyMobile}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {copiedMobile && <span className="text-[10px] text-emerald-400 font-bold ml-1">Copied!</span>}
                  </span>
                  {user.userType === "RETAILER" && user.shopName && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Store className="h-3.5 w-3.5 text-emerald-400" />
                        {user.shopName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Clearance</span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active 2FA & Session Enforced
              </span>
            </div>
          </div>
        </div>
      </section>

      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Details Form */}
        <section className="lg:col-span-7">
          <form 
            onSubmit={saveProfile} 
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                Personal & Business Details
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage your public name and operational communication channel.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter your legal full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={user.mobile ?? ""}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-10 text-sm font-mono font-medium text-slate-600 cursor-not-allowed"
                  />
                  <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Primary mobile number is bound to KYC and cannot be modified online.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. yourname@domain.com (optional)"
                  />
                </div>
              </div>

              {user.userType === "RETAILER" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Store / Shop Board Name
                  </label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={shop}
                      onChange={(e) => setShop(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. Jai Hind Communication & Xerox"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-navy-950 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-navy-900 transition-colors disabled:opacity-50"
              >
                {busy ? "Saving Changes…" : "Save Profile Details"}
              </button>
            </div>
          </form>
        </section>

        {/* Security / Password Form */}
        <section className="lg:col-span-5">
          <form 
            onSubmit={savePassword} 
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-bold text-navy-950 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                Security & Password
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Protect your fintech till access with regular credential updates.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="At least 8 characters"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Minimum 8 characters with a mix of numbers & symbols recommended.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Security Reminder
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                Never share your password, OTP, or PIN with anyone claiming to be Gfinpay support.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-bold text-navy-950 shadow-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {busy ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

