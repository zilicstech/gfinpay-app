import Link from "next/link";
import { ArrowLeft, Compass, Home, PhoneCall } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-navy-900 sm:px-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="inline-block mb-8">
          <Logo />
        </div>

        <div className="panel p-8 sm:p-12 shadow-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 shadow-inner">
            <Compass className="h-10 w-10 animate-spin-slow" />
          </div>

          <span className="mt-6 inline-block rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold tracking-wider uppercase text-slate-600">
            Error 404 · Route Not Found
          </span>

          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
            This Page Doesn&apos;t Exist
          </h1>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            The link you clicked might be outdated, mistyped, or the financial service route may have been reorganized.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="btn-primary w-full sm:w-auto shadow-lg shadow-emerald-500/20"
            >
              <Home className="h-4 w-4" />
              <span>Back to Homepage</span>
            </Link>
            <Link
              href="/services"
              className="btn-secondary w-full sm:w-auto"
            >
              <span>Explore Services</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
              <span>Need help? Call <strong>{SITE.phone}</strong></span>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
