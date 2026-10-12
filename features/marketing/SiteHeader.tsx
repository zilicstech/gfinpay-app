"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  FileCheck2,
  Fingerprint,
  Headphones,
  Landmark,
  Layers,
  Menu,
  QrCode,
  Radio,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Tv,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/site";
import { homeFor, useSession, useSessionHydrated } from "@/stores/session.store";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useSessionHydrated();
  const { token, user, bootstrapped } = useSession();
  const signedIn = hydrated && bootstrapped && Boolean(token) && Boolean(user?.userType);
  const ctaHref = signedIn ? homeFor(user?.userType, user?.status) : "/login";
  const ctaLabel = signedIn ? "Go to dashboard" : "Partner Login";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm transition-all duration-300">
      <SignedOutNotice />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo compact />
        </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 text-sm font-medium text-navy-700 lg:flex">
            <Link
              href="/"
              className="rounded-xl px-3.5 py-2 hover:bg-slate-100/70 hover:text-navy-950 transition"
            >
              Home
            </Link>

            {/* Services Dropdown */}
            <ServicesMegaMenu />


            <Link
              href="/about"
              className="rounded-xl px-3.5 py-2 hover:bg-slate-100/70 hover:text-navy-950 transition"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="rounded-xl px-3.5 py-2 hover:bg-slate-100/70 hover:text-navy-950 transition"
            >
              Contact
            </Link>
          </nav>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href={ctaHref}
              className="btn-primary group !py-2.5 !px-5 text-sm shadow-emerald-500/20"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-sm transition hover:bg-slate-50 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Full Screen Drawer */}
        {mobileOpen && (
          <div className="border-t border-slate-200/90 bg-white/95 backdrop-blur-2xl px-4 py-5 shadow-2xl lg:hidden max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
              <span className="d2c-badge text-[11px]">Instant Wallet Settled</span>
            </div>

            <div className="space-y-1">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                Financial Services
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/services/domestic-money-transfer", label: "Send Money", icon: Landmark },
                  { href: "/services/bbps", label: "Bill Pay (BBPS)", icon: Zap },
                  { href: "/services/recharge", label: "Mobile & DTH", icon: Tv },
                  { href: "/services/aeps", label: "Aadhaar Cash", icon: Fingerprint },
                  { href: "/services/upi-cash-out", label: "UPI to Cash", icon: QrCode },
                  { href: "/services/fastag", label: "FASTag Top-up", icon: Radio },
                  { href: "/services/lic", label: "LIC Premium", icon: ShieldCheck },
                  { href: "/services/fd-credit-cards", label: "FD Cards & Loans", icon: CreditCard },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-semibold text-navy-900 active:bg-emerald-50 active:border-emerald-200"
                    >
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{s.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 pt-4">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Company & Platform</p>
              <div className="space-y-1">

                <Link
                  href="/about"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-navy-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>About {SITE.name}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-navy-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Contact Sales & Support</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={ctaHref}
                className="btn-primary w-full shadow-lg shadow-emerald-500/25"
                onClick={() => setMobileOpen(false)}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2.5 text-center text-xs text-slate-400">
                Appointed retailers, distributors, and staff only.
              </p>
            </div>
          </div>
        )}
    </header>
  );
}

/**
 * Shown after an idle sign-out, which lands on `/?signedOut=idle`. Read from the browser
 * rather than useSearchParams so the marketing pages stay statically rendered.
 */
function SignedOutNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(new URLSearchParams(window.location.search).get("signedOut") === "idle");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="border-b border-amber-200/80 bg-amber-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
          You were signed out after 30 minutes of inactivity. Please sign in again to continue.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-amber-700 transition hover:bg-amber-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ServicesMegaMenu() {
  return (
    <div className="group relative">
      <button className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-navy-700 hover:bg-slate-100/70 hover:text-navy-950 transition">
        <span>Services</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180" />
      </button>

      {/* Modern 3-Column Dropdown Card */}
      <div className="invisible absolute left-1/2 -translate-x-1/2 top-full z-50 mt-1 w-[46rem] translate-y-2 rounded-3xl border border-slate-200/90 bg-white/95 p-6 backdrop-blur-2xl opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Money Movement & Cash */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Money & Cash</p>
            </div>
            <div className="space-y-1">
              <ServiceItem
                href="/services/domestic-money-transfer"
                title="Send Money (DMT)"
                desc="IMPS/NEFT to any Indian bank with instant verification"
              />
              <ServiceItem
                href="/services/upi-cash-out"
                title="UPI to Cash"
                desc="Dynamic QR collect, hand cash to customer"
              />
              <ServiceItem
                href="/services/aeps"
                title="Aadhaar AePS"
                desc="Biometric cash withdrawal without bank cards"
              />
              <ServiceItem
                href="/services/agent-wallet"
                title="Retailer Wallet"
                desc="Pre-funded wallet with immutable double-entry ledger"
              />
            </div>
          </div>

          {/* Column 2: BBPS & Utilities */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bills & Utilities</p>
            </div>
            <div className="space-y-1">
              <ServiceItem
                href="/services/bbps"
                title="BBPS Utility Bills"
                desc="Electricity, water, piped gas, municipal taxes"
              />
              <ServiceItem
                href="/services/recharge"
                title="Mobile & DTH"
                desc="Airtel, Jio, Vi, BSNL, Tata Play, Dish TV"
              />
              <ServiceItem
                href="/services/fastag"
                title="FASTag Recharge"
                desc="Instant highway toll vehicle balance top-up"
              />
              <ServiceItem
                href="/services/lic"
                title="LIC & Insurance"
                desc="Fetch policy premium and issue official tax receipts"
              />
            </div>
          </div>

          {/* Column 3: Secured Digital Products */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-navy-950 p-4 text-white flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 mb-3">
                <Sparkles className="h-3 w-3" /> Guaranteed Approvals
              </span>
              <p className="font-display text-base font-bold text-white">Digital Banking Products</p>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Offer FD-backed credit cards (SBM/IOB), personal loans, and zero-balance savings accounts.
              </p>
              <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                <Link
                  href="/services/fd-credit-cards"
                  className="flex items-center justify-between text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>FD Credit Cards (Novu/ZET)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/services/bc-network"
                  className="flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <span>Business Correspondent Network</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-white/10 p-2.5 text-[11px] text-slate-300 border border-white/10">
              <span className="font-semibold text-white">100% Digital KYC</span> with zero physical paperwork.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ServiceItem({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group/item block rounded-xl px-3 py-2 transition hover:bg-slate-50"
    >
      <p className="text-xs font-semibold text-navy-950 group-hover/item:text-emerald-600 transition">
        {title}
      </p>
      <p className="text-[11px] text-slate-500 line-clamp-1">{desc}</p>
    </Link>
  );
}
