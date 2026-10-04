import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function ApplyDonePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-mesh opacity-70 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="inline-block mb-8">
          <Logo />
        </div>

        <div className="panel p-8 sm:p-10 shadow-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>

          <span className="mt-5 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Application Completed
          </span>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            You&apos;re All Set!
          </h1>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Thank you for completing your application. The partner bank and your retailer have been notified of your submission. You will receive an SMS confirmation once the bank confirms verification.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-500">
            You may now safely close this browser window. Your sensitive data has been transmitted securely via bank-grade encryption.
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Encrypted Bank-Grade Financial Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
