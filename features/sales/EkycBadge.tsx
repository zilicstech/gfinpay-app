import { BadgeCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";

export function EkycBadge({ status }: { status?: string }) {
  const norm = (status ?? "").toUpperCase();

  if (norm === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-500/25 shadow-xs">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
        Verified
      </span>
    );
  }

  if (norm === "PENDING" || norm === "SUBMITTED" || norm === "IN_PROGRESS" || norm === "PENDING_KYC") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-500/25">
        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 animate-spin" style={{ animationDuration: "6s" }} aria-hidden />
        KYC In Review
      </span>
    );
  }

  if (norm === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-500/25">
        <ShieldX className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      Unverified
    </span>
  );
}
