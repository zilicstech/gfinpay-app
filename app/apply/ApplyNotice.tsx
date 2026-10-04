import Link from "next/link";
import { AlertCircle, ArrowLeft, Headphones, HelpCircle, Lock, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function ApplyNotice({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo compact />
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-white p-8 shadow-xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="font-display text-xl font-extrabold text-navy-950">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="btn-secondary w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Homepage</span>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>Official Gfinpay Assisted Banking Rails</span>
          </div>
        </div>
      </div>
    </main>
  );
}
