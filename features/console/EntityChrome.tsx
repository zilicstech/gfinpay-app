"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Settings } from "lucide-react";
import { StatusPill } from "@/components/ui/primitives";

export type Crumb = { href?: string; label: string };
export type MetaItem = { icon: ReactNode; label: string };
export type ManageAction = { label: string; onClick: () => void; tone?: "default" | "danger" };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-navy-400" />}
            {item.href && !last ? (
              <Link href={item.href} className="font-medium text-brand-700 hover:underline">{item.label}</Link>
            ) : (
              <span className={last ? "font-medium text-navy-700" : "text-navy-500"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function MetaBadge({ icon, label }: MetaItem) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[11px] font-semibold text-navy-800 ring-1 ring-navy-900/10">
      <span className="text-brand-700">{icon}</span>
      {label}
    </span>
  );
}

export const entityPrimaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-200";

export function initialsFromName(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ManageMenu({
  actions,
  variant = "default",
}: {
  actions: ManageAction[];
  variant?: "default" | "onDark";
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onDismiss() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("resize", onDismiss);
    };
  }, [open]);

  if (actions.length === 0) return null;

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] w-56 overflow-hidden rounded-xl border border-navy-900/10 bg-white py-1 shadow-lg"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {actions.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`block w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-[#f5f5f5] ${
                  item.tone === "danger" ? "text-rose-700" : "text-navy-800"
                }`}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={variant === "onDark" ? entityPrimaryActionClass : "btn-primary"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Settings className="h-4 w-4" />
        Manage
      </button>
      {menu}
    </div>
  );
}

export function EntityHeader({
  crumbs,
  title,
  status,
  meta,
  actions,
}: {
  crumbs: Crumb[];
  title: string;
  status?: string;
  meta?: MetaItem[];
  actions?: ManageAction[];
}) {
  return (
    <div className="mb-6">
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl tracking-tight text-navy-950">{title}</h1>
            {status && <StatusPill value={status} />}
          </div>
          {!!meta?.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {meta.map((m) => <MetaBadge key={m.label} icon={m.icon} label={m.label} />)}
            </div>
          )}
        </div>
        {actions && actions.length > 0 && <ManageMenu actions={actions} />}
      </div>
    </div>
  );
}

export function EntityHero({
  title,
  status,
  badges,
  code,
  lines,
  avatar,
  manageActions,
  primaryActions,
  stats,
  footer,
}: {
  title: string;
  status?: string;
  badges?: ReactNode;
  code?: string | null;
  lines?: ReactNode[];
  avatar?: string;
  manageActions?: ManageAction[];
  primaryActions?: ReactNode;
  stats?: { label: string; value: ReactNode }[];
  footer?: ReactNode;
}) {
  const mark = avatar ?? initialsFromName(title);
  const statCols =
    !stats?.length
      ? ""
      : stats.length >= 4
        ? "grid-cols-2 sm:grid-cols-4"
        : stats.length === 2
          ? "grid-cols-2"
          : "grid-cols-3";

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm border border-slate-200/80">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative bg-navy-950 px-6 py-10 sm:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20">
              {mark}
            </div>
            <div className="min-w-0 mt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl tracking-tight text-white">{title}</h1>
                {status ? <StatusPill value={status} /> : null}
                {badges}
              </div>
              {code ? (
                <p className="mt-2 font-mono text-sm tracking-widest text-emerald-400/90 bg-emerald-500/10 inline-block px-2 py-0.5 rounded">{code}</p>
              ) : null}
              <div className="mt-3 space-y-1">
                {lines?.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
          {manageActions && manageActions.length > 0 ? (
            <ManageMenu actions={manageActions} variant="onDark" />
          ) : null}
        </div>
        {primaryActions ? <div className="relative z-10 mt-8 flex flex-wrap gap-3">{primaryActions}</div> : null}
      </div>
      {footer ? footer : stats && stats.length > 0 ? (
        <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white ${statCols}`}>
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-6 transition-colors hover:bg-slate-50/50">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="mt-2 break-words font-display text-3xl text-navy-950">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function EntityTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (key: T) => void;
  items: { key: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 backdrop-blur-sm w-fit">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
            value === item.key 
              ? "bg-white text-navy-950 shadow-sm ring-1 ring-slate-200/50" 
              : "text-slate-500 hover:text-navy-700 hover:bg-slate-200/50"
          }`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function RecordFacts({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        <h2 className="font-display text-xl font-bold text-navy-950">Record Details</h2>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2 px-6 py-4 sm:grid-cols-[14rem_1fr] sm:items-center hover:bg-slate-50/50 transition-colors">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{row.label}</dt>
            <dd className="break-all text-sm font-semibold text-navy-900">{row.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
