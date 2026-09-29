import { BadgeCheck, ShieldAlert } from "lucide-react";

export function EkycBadge({ status }: { status?: string }) {
  const verified = status === "VERIFIED";

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-500/25">
        <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
      Unverified
    </span>
  );
}
