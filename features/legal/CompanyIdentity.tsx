import { Building2 } from "lucide-react";
import { SITE } from "@/lib/site";

const FIELDS = [
  ["Company name", SITE.legalName],
  ["CIN", SITE.cin],
  ["ROC", SITE.roc],
  ["Registration number", SITE.registrationNumber],
  ["Date of incorporation", SITE.incorporatedOn],
  ["Registered address", SITE.registeredAddress],
] as const;

export function CompanyIdentity() {
  return (
    <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-6 sm:p-8">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
        <Building2 className="h-4 w-4" />
        Registered company
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map(([label, value]) => (
          <div key={label} className={label === "Registered address" ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-navy-950">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
