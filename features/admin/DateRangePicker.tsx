"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

function parseIso(value: string) {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmt(value?: Date) {
  if (!value) return "";
  return value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function committedSummary(from: string, to: string) {
  const start = parseIso(from);
  const end = parseIso(to);
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `${fmt(start)} – …`;
  return "Select dates";
}

export function DateRangePicker({
  from,
  to,
  onChange,
  label = "Date range",
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const wrap = useRef<HTMLDivElement>(null);

  function openPicker() {
    setDraft({ from: parseIso(from), to: parseIso(to) });
    setOpen(true);
  }

  function closeWithoutApply() {
    setOpen(false);
    setDraft(undefined);
  }

  function apply() {
    if (!draft?.from || !draft.to) return;
    onChange(toIso(draft.from), toIso(draft.to));
    setOpen(false);
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) closeWithoutApply();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWithoutApply();
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ready = Boolean(draft?.from && draft?.to);
  const hint = draft?.from && draft?.to
    ? `${fmt(draft.from)} – ${fmt(draft.to)}`
    : draft?.from
      ? "Pick the end date"
      : "Pick the start date";

  return (
    <div className="w-[17.5rem]" ref={wrap}>
      <p className="text-sm font-medium text-navy-800">{label}</p>
      <div className="relative mt-1.5">
        <button
          type="button"
          className="field flex items-center justify-between gap-2 text-left"
          onClick={() => (open ? closeWithoutApply() : openPicker())}
        >
          <span className={from && to ? "text-black" : "text-neutral-400"}>{committedSummary(from, to)}</span>
          <CalendarRange className="h-4 w-4 shrink-0 text-navy-500" />
        </button>
        {open && (
          <div className="report-range-picker absolute left-0 z-30 mt-2 w-[17.5rem] rounded-2xl border border-navy-900/10 bg-white p-3 shadow-lift">
            <p className="mb-2 text-xs font-medium text-navy-500">{hint}</p>
            <DayPicker
              mode="range"
              required
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={1}
              disabled={{ after: new Date() }}
              defaultMonth={draft?.from ?? parseIso(from) ?? new Date()}
            />
            <div className="mt-3 flex justify-end gap-2 border-t border-navy-900/10 pt-3">
              <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={closeWithoutApply}>
                Cancel
              </button>
              <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={!ready} onClick={apply}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
