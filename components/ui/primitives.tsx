import type { ReactNode } from "react";

const styles = {
  HOLD: "bg-amber-50 text-amber-900 ring-amber-200",
  PENDING: "bg-sky-50 text-sky-900 ring-sky-200",
  SUCCESS: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 ring-rose-200",
  INITIATED: "bg-slate-100 text-navy-700 ring-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  LIVE: "bg-brand-50 text-brand-700 ring-brand-200",
  SUSPENDED: "bg-amber-50 text-amber-900 ring-amber-200",
  TERMINATED: "bg-rose-50 text-rose-800 ring-rose-200",
  PENDING_KYC: "bg-sky-50 text-sky-900 ring-sky-200",
  FROZEN: "bg-rose-50 text-rose-800 ring-rose-200",
  VERIFIED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  UNVERIFIED: "bg-amber-50 text-amber-900 ring-amber-200",
  NOT_STARTED: "bg-amber-50 text-amber-900 ring-amber-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
  IN_PROGRESS: "bg-sky-50 text-sky-900 ring-sky-200",
  DISABLED: "bg-slate-100 text-navy-600 ring-slate-200",
  COMPLETED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  ACTIVATED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  LINK_CREATED: "bg-sky-50 text-sky-900 ring-sky-200",
  OPENED: "bg-sky-50 text-sky-900 ring-sky-200",
  CONVERTED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  RETAILER: "bg-[#f5f5f5] text-navy-800 ring-navy-900/10",
  DISTRIBUTOR: "bg-brand-50 text-brand-800 ring-brand-200",
  ADMIN: "bg-navy-950 text-brand-400 ring-navy-800",
  MASTER_DISTRIBUTOR: "bg-brand-50 text-brand-800 ring-brand-200",
  SUPER_ADMIN: "bg-navy-950 text-brand-400 ring-navy-800",
  CREDIT: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  DEBIT: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

/** Active step / tab / chip — matches header avatar (black + emerald). */
export const activeTillClass = "bg-black text-emerald-300";

export function StatusPill({
  value,
  label,
  pulse,
}: {
  value: string;
  label?: string;
  pulse?: boolean;
}) {
  const key = value as keyof typeof styles;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        styles[key] ?? "bg-[#f5f5f5] text-navy-700 ring-navy-900/10"
      }`}
    >
      {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label ?? value.replaceAll("_", " ")}
    </span>
  );
}

export function AccentTile({
  children,
  className = "h-10 w-10 rounded-xl",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`grid place-items-center bg-black text-emerald-300 ${className}`}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-navy-600">{label}</p>
          <p className="mt-2 font-display text-3xl tracking-tight text-navy-950">{value}</p>
          {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
        </div>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-black text-emerald-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-medium text-brand-700">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl tracking-tight text-navy-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-900/15 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-navy-950">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">{body}</p>
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const map = {
    info: "bg-sky-50 text-sky-950 ring-sky-200",
    error: "bg-rose-50 text-rose-800 ring-rose-200",
    success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  };
  return <div className={`rounded-xl px-3 py-2.5 text-sm ring-1 ${map[tone]}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-navy-800">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Modal({
  open,
  title,
  description,
  wide = false,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose?: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy-950/40" aria-hidden />
      <div className={`relative z-10 w-full rounded-2xl border border-navy-900/10 bg-white p-6 shadow-xl ${wide ? "max-w-5xl" : "max-w-lg"}`}>
        <div className="mb-4">
          <h2 className="font-display text-2xl text-navy-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-navy-600">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div className="space-y-2 md:hidden">
        {rows.map((cells, i) => (
          <div key={i} className="rounded-2xl border border-navy-900/10 bg-white p-4">
            {cells.map((cell, j) => (
              <div key={j} className={`flex items-start justify-between gap-3 ${j > 0 ? "mt-2 border-t border-navy-900/5 pt-2" : ""}`}>
                <span className="text-[11px] font-medium uppercase tracking-wide text-navy-400">{columns[j]}</span>
                <span className="text-right text-sm font-medium text-navy-900">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-navy-900/10 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f5f5f5] text-xs font-semibold text-navy-600">
            <tr>
              {columns.map((c, i) => (
                <th key={`${i}-${c}`} className="px-4 py-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} className="border-t border-navy-900/5">
                {cells.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-middle text-navy-800">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
