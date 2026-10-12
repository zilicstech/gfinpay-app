"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function ApplyHandoff({
  url,
  encdata,
  method,
  title = "Connecting to Official Portal",
  body = "Please wait while we safely redirect you to the verified banking onboarding portal to complete your application.",
  points = [
    "Customer-funded security deposit (AML verified)",
    "Retailer never accesses your card or banking credentials",
  ],
}: {
  url: string;
  encdata: string;
  method?: string;
  title?: string;
  body?: string;
  points?: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirecting(true);
      if (method === "GET" || !encdata) {
        window.location.replace(url);
        return;
      }
      formRef.current?.submit();
    }, 800);

    return () => clearTimeout(timer);
  }, [url, encdata, method]);

  return (
    <div className="w-full max-w-md px-4 py-12 text-center">
      {/* Brand & Security Header */}
      <div className="flex justify-center mb-6">
        <Logo compact />
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-white p-8 shadow-2xl">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        {/* Security badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-6">
          <Lock className="h-3 w-3 text-emerald-600" />
          <span>256-Bit Encrypted Partner Handoff</span>
        </div>

        {/* Animated Radar / Scanner */}
        <div className="relative mx-auto my-4 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-60" />
          <div className="absolute inset-2 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

        <h1 className="mt-4 font-display text-xl font-extrabold text-navy-950">
          {title}
        </h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          {body}
        </p>

        {/* Safety checklist */}
        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-left text-xs space-y-2 text-slate-600">
          {points.map((point) => (
            <div key={point} className="flex items-center gap-2 text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{point}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[11px] text-slate-400">
          Do not refresh or close this window.
        </p>
      </div>

      {method !== "GET" && encdata && (
        <form ref={formRef} method="post" action={url} className="hidden">
          <textarea name="encdata" readOnly defaultValue={encdata} />
        </form>
      )}
    </div>
  );
}
