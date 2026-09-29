"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { Alert, Field, Modal } from "@/components/ui/primitives";
import { ApiClientError } from "@/lib/api-client";

export function ViewLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-semibold text-brand-700 hover:underline">
      View
    </Link>
  );
}

export function DetailStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={`grid gap-3 sm:grid-cols-2 ${items.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-[#f5f5f5] px-4 py-3">
          <dt className="text-xs font-medium text-navy-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-semibold text-navy-950">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-[#f5f5f5] px-4 py-3">
          <dt className="text-xs font-medium text-navy-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-semibold text-navy-950">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Flash({ message, error }: { message?: string | null; error?: string | null }) {
  return (
    <>
      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
    </>
  );
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.error.message : fallback;
}

export function useFlash() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return {
    message,
    error,
    ok: (text: string) => {
      setError(null);
      setMessage(text);
    },
    fail: (err: unknown, fallback: string) => {
      setMessage(null);
      setError(errorMessage(err, fallback));
    },
    clear: () => {
      setMessage(null);
      setError(null);
    },
  };
}

export function ActionForm({
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <form className="card space-y-3" onSubmit={onSubmit}>
      <div>
        <h3 className="font-display text-xl text-navy-950">{title}</h3>
        {description && <p className="mt-1 text-sm text-navy-600">{description}</p>}
      </div>
      {children}
      <button className="btn-primary w-full" type="submit">{submitLabel}</button>
    </form>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <Field label={label}>
      <input className="field" type={type} required={required} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <select className="field" required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function FormModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitLabel,
  children,
  submitDisabled,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel: string;
  children: ReactNode;
  submitDisabled?: boolean;
}) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitDisabled}>{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}

export type DirectoryAssignItem = {
  id: string;
  title: string;
  subtitle?: string;
  assignedHere?: boolean;
};

export function DirectoryAssignModal({
  open,
  title,
  description,
  items,
  selected,
  loading,
  emptyTitle,
  onToggle,
  onClose,
  onSubmit,
  submitLabel = "Assign selected",
}: {
  open: boolean;
  title: string;
  description?: string;
  items: DirectoryAssignItem[];
  selected: Set<string>;
  loading?: boolean;
  emptyTitle?: string;
  onToggle: (id: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel?: string;
}) {
  const selectable = items.filter((i) => !i.assignedHere);
  const picked = [...selected].filter((id) => selectable.some((i) => i.id === id)).length;

  return (
    <FormModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={picked > 0 ? `${submitLabel} (${picked})` : submitLabel}
      submitDisabled={loading || picked === 0}
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 animate-pulse rounded-xl bg-[#f5f5f5]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-navy-600">{emptyTitle ?? "No users available."}</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const checked = item.assignedHere || selected.has(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                    item.assignedHere
                      ? "cursor-default border-brand-200 bg-brand-50/60"
                      : checked
                        ? "border-brand-400 bg-brand-50"
                        : "border-[#e8e0d0] bg-white hover:border-brand-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={item.assignedHere}
                    onChange={() => onToggle(item.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-navy-950">{item.title}</span>
                    {item.subtitle && (
                      <span className="mt-0.5 block text-xs text-navy-500">{item.subtitle}</span>
                    )}
                    {item.assignedHere && (
                      <span className="mt-1 inline-block text-xs font-medium text-brand-700">Already on this hub</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </FormModal>
  );
}
