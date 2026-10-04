import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Lock, Mail, Phone, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-slate-800 bg-navy-950 text-slate-400 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Partner Rails & Trust Bar */}
      <div className="relative border-b border-slate-800/80 bg-slate-900/60 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Official Rail Integrations
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
              <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:border-emerald-400/40 transition">
                ⚡ NPCI Bharat BillPay (BBPS)
              </span>
              <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:border-emerald-400/40 transition">
                💸 IMPS & NEFT Switch
              </span>
              <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:border-emerald-400/40 transition">
                📲 Dynamic UPI QR
              </span>
              <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:border-emerald-400/40 transition">
                💳 RuPay & BaaS Card Issuers
              </span>
              <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 hover:border-emerald-400/40 transition">
                🔒 UIDAI AePS Biometrics
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {/* Brand column */}
        <div className="lg:col-span-2 space-y-4">
          <Logo light />
          <p className="max-w-sm text-sm text-slate-300 leading-relaxed">
            {SITE.tagline}. Enabling neighborhood kirana outlets to deliver institutional-grade digital banking and payment rails.
          </p>

          <div className="pt-2 text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Toll Free: 1800 890 4040</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              <span>{SITE.email}</span>
            </p>
          </div>
        </div>

        {/* Services column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white">Payment Rails</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.services.slice(0, 6).map((s) => (
              <li key={s.href}>
                <Link className="hover:text-emerald-400 transition" href={s.href}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Banking products column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white">Digital Banking</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.services.slice(6).map((s) => (
              <li key={s.href}>
                <Link className="hover:text-emerald-400 transition" href={s.href}>
                  {s.label}
                </Link>
              </li>
            ))}

          </ul>
        </div>

        {/* Company & Compliance column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white">Governance</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link className="hover:text-emerald-400 transition" href="/about">
                About Us
              </Link>
            </li>

            <li>
              <Link className="hover:text-emerald-400 transition" href="/insights">
                Industry Insights
              </Link>
            </li>
            <li>
              <Link className="hover:text-emerald-400 transition" href="/contact">
                Contact & Hubs
              </Link>
            </li>
            <li>
              <Link className="hover:text-emerald-400 transition" href="/legal/privacy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="hover:text-emerald-400 transition" href="/legal/terms">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className="text-emerald-400 font-semibold hover:text-emerald-300 inline-flex items-center gap-1" href="/login">
                <span>Retailer Login</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-slate-800/80 py-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-slate-500 lg:px-8">
          <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>256-bit TLS Encrypted Financial Rails · Immutable Double-Entry Ledger</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
