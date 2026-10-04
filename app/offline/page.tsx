"use client";

import Link from "next/link";
import { WifiOff, RotateCcw, Home, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-navy-900 sm:px-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="inline-block mb-8">
          <Logo />
        </div>

        <div className="panel p-8 sm:p-10 shadow-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
            <WifiOff className="h-8 w-8 animate-pulse" />
          </div>

          <span className="mt-5 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Connection Lost
          </span>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            You&apos;re Offline
          </h1>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Real-time wallet balances and transaction ledgers are strictly live-streamed and never cached locally for your security. Please check your internet connection.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full shadow-lg shadow-emerald-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Connection</span>
            </button>
            <Link
              href="/"
              className="btn-secondary w-full"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Encrypted Bank-Grade Financial Protection</span>
          </div>
        </div>
      </div>
    </main>
  );
}
