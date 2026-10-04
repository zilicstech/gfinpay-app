import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  Landmark,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { LedgerArt, ServiceArt } from "@/components/illustrations/HomeArt";
import { seo } from "@/lib/seo";
import { NAV, SITE } from "@/lib/site";

export function serviceMeta(path: string, title: string, description: string) {
  return seo({ title, description, path });
}

export function ServiceLayout({
  title,
  kicker,
  lead,
  art,
  commission,
  steps,
  highlights,
  partners,
  children,
}: {
  title: string;
  kicker: string;
  lead: string;
  art?: "dmt" | "aeps" | "upi" | "wallet" | "cards" | "network" | "ledger" | "bbps" | "recharge" | "fastag" | "lic";
  commission?: string;
  steps?: Array<{ step: string; title: string; desc: string }>;
  highlights?: Array<string>;
  partners?: Array<string>;
  children?: ReactNode;
}) {
  const defaultSteps = steps || [
    { step: "01", title: "Customer Walk-in", desc: "Customer brings cash, bill CA number, or mobile." },
    { step: "02", title: "1-Click Pay", desc: "Enter amount on your phone & confirm transaction." },
    { step: "03", title: "Instant Profit", desc: "Direct commission added to your wallet in 5 seconds." },
  ];

  return (
    <div className="py-8 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-navy-950 transition">Home</Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link href="/services" className="hover:text-navy-950 transition">Services</Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-emerald-700 truncate">{title}</span>
        </nav>

        {/* Hero Card - Visual First */}
        <div className="overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 bg-white shadow-card mb-12">
          <div className="grid items-center gap-8 lg:grid-cols-12 p-6 sm:p-10 lg:p-12">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="d2c-badge">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  <span>{kicker}</span>
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-navy-950 leading-tight">
                {title}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                {lead}
              </p>

              {/* High-Impact Commission Card */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Retailer Commission
                    </p>
                    <p className="font-display text-xl sm:text-2xl font-black text-emerald-950">
                      {commission || "Instant ₹5 - ₹75 Commission on Every Transaction"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/login" className="btn-primary !px-7 !py-3.5 text-sm font-bold shadow-lg shadow-emerald-500/25">
                  <span>Start at Counter</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-secondary !px-5 !py-3.5 text-sm font-bold">
                  <PhoneCall className="h-4 w-4 text-slate-500" />
                  <span>Call Support</span>
                </Link>
              </div>

              {/* 3 Trust Signals */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Instant Wallet Credit</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Works on Any Mobile</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>RBI Compliant Rails</span>
                </span>
              </div>
            </div>

            {/* Right Large Illustration Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xl aspect-square">
                <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 w-full h-full">
                  {art ? (
                    art === "ledger" ? <LedgerArt /> : <ServiceArt kind={art} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step Visual Process */}
        <section className="mb-14">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="d2c-badge">
              <Zap className="h-3.5 w-3.5 text-brand-600" />
              <span>3 Easy Steps</span>
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-950">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Only takes 30 to 60 seconds per customer at your retail till.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {defaultSteps.map((s, idx) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-black text-emerald-500/20">{s.step}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                    #{idx + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-navy-950">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported Partners / Discoms / Banks Badges */}
        {partners && partners.length > 0 ? (
          <section className="mb-14 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Supported Networks & Billers
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {partners.map((p) => (
                <span
                  key={p}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy-950 shadow-xs"
                >
                  ✓ {p}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Extra Children / Highlights */}
        {children ? (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm space-y-4 mb-14 text-sm text-slate-600 leading-relaxed">
            {children}
          </div>
        ) : null}

        {/* Quick Rail Directory Navigation */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-display text-base font-bold text-navy-950">Explore Other Services</h3>
            <Link href="/services" className="text-xs font-bold text-emerald-600 hover:underline">
              View All 10 Services →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {NAV.services.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-bold text-navy-900 hover:bg-emerald-50 hover:border-emerald-200 transition"
              >
                <span className="truncate">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom Fast Action Banner */}
        <div className="mt-12 rounded-3xl bg-navy-950 p-6 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold">Start earning today</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              No machine required. Just login on your phone or laptop and start serving customers.
            </p>
          </div>
          <Link href="/login" className="btn-primary !px-7 !py-3.5 text-sm font-bold shrink-0 shadow-lg shadow-emerald-500/25">
            <span>Login to Desk</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
