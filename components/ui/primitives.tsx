import type { ReactNode } from "react";

type BadgeStyle = {
  container: string;
  dot?: string;
  ping?: boolean;
};

const badgeStyles: Record<string, BadgeStyle> = {
  // Success / Active
  SUCCESS: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: true },
  ACTIVE: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: true },
  LIVE: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: true },
  VERIFIED: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: false },
  COMPLETED: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: false },
  ACTIVATED: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: false },
  CONVERTED: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: false },
  CREDIT: { container: "bg-emerald-50 text-emerald-800 ring-emerald-500/25", dot: "bg-emerald-500", ping: false },

  // Pending / In progress
  PENDING: { container: "bg-amber-50 text-amber-800 ring-amber-500/25", dot: "bg-amber-500", ping: true },
  PENDING_KYC: { container: "bg-amber-50 text-amber-800 ring-amber-500/25", dot: "bg-amber-500", ping: true },
  IN_PROGRESS: { container: "bg-sky-50 text-sky-800 ring-sky-500/25", dot: "bg-sky-500", ping: true },
  OPENED: { container: "bg-sky-50 text-sky-800 ring-sky-500/25", dot: "bg-sky-500", ping: false },
  LINK_CREATED: { container: "bg-sky-50 text-sky-800 ring-sky-500/25", dot: "bg-sky-500", ping: false },
  INITIATED: { container: "bg-slate-100 text-slate-800 ring-slate-300", dot: "bg-slate-400", ping: false },
  HOLD: { container: "bg-amber-50 text-amber-800 ring-amber-500/25", dot: "bg-amber-500", ping: false },

  // Danger / Terminated / Failed
  FAILED: { container: "bg-rose-50 text-rose-800 ring-rose-500/25", dot: "bg-rose-500", ping: false },
  TERMINATED: { container: "bg-rose-50 text-rose-800 ring-rose-500/25", dot: "bg-rose-500", ping: false },
  REJECTED: { container: "bg-rose-50 text-rose-800 ring-rose-500/25", dot: "bg-rose-500", ping: false },
  FROZEN: { container: "bg-rose-50 text-rose-800 ring-rose-500/25", dot: "bg-rose-500", ping: false },
  DEBIT: { container: "bg-rose-50 text-rose-800 ring-rose-500/25", dot: "bg-rose-500", ping: false },

  // Inactive / Suspended / Neutral
  SUSPENDED: { container: "bg-amber-50/80 text-amber-900 ring-amber-300", dot: "bg-amber-400", ping: false },
  UNVERIFIED: { container: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", ping: false },
  NOT_STARTED: { container: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", ping: false },
  DISABLED: { container: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400", ping: false },

  // Role Chips
  ADMIN: { container: "bg-slate-900 text-amber-300 ring-slate-800", dot: "bg-amber-400", ping: false },
  SUPER_ADMIN: { container: "bg-slate-900 text-emerald-300 ring-slate-800", dot: "bg-emerald-400", ping: false },
  DISTRIBUTOR: { container: "bg-emerald-950 text-emerald-300 ring-emerald-800/40", dot: "bg-emerald-400", ping: false },
  MASTER_DISTRIBUTOR: { container: "bg-emerald-950 text-emerald-300 ring-emerald-800/40", dot: "bg-emerald-400", ping: false },
  RETAILER: { container: "bg-indigo-950 text-indigo-300 ring-indigo-800/40", dot: "bg-indigo-400", ping: false },
};

/** Active step / tab / chip — matches header avatar (black + emerald). */
export const activeTillClass = "bg-black text-emerald-300 shadow-sm";

export function StatusPill({
  value,
  label,
  pulse,
}: {
  value: string;
  label?: string;
  pulse?: boolean;
}) {
  const normalizedKey = value.toUpperCase();
  const config = badgeStyles[normalizedKey] ?? {
    container: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
    ping: false,
  };
  const shouldPulse = pulse ?? config.ping;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${config.container}`}
    >
      {config.dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {shouldPulse && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`} />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`} />
        </span>
      )}
      <span>{label ?? value.replaceAll("_", " ")}</span>
    </span>
  );
}

export function AccentTile({
  children,
  className = "h-12 w-12 rounded-2xl",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`grid place-items-center bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 ${className}`}>
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30 group">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl tracking-tight text-navy-950">{value}</p>
          {hint && <p className="mt-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">{hint}</p>}
        </div>
        {icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-emerald-600 ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/60 pb-6">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md">{eyebrow}</p>}
        <h1 className="font-display text-3xl tracking-tight text-navy-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
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
      <div className="space-y-4 md:hidden">
        {rows.map((cells, i) => (
          <div key={i} className="card p-5">
            {cells.map((cell, j) => (
              <div key={j} className={`flex items-start justify-between gap-4 ${j > 0 ? "mt-3 border-t border-slate-100 pt-3" : ""}`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{columns[j]}</span>
                <span className="text-right text-sm font-medium text-navy-900">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              {columns.map((c, i) => (
                <th key={`${i}-${c}`} className="px-6 py-4">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((cells, i) => (
              <tr key={i} className="transition-colors hover:bg-slate-50/50 group">
                {cells.map((cell, j) => (
                  <td key={j} className="px-6 py-4 align-middle text-navy-800 font-medium group-hover:text-navy-950 transition-colors">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
