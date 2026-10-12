"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SelectOption = {
  value: string | number;
  label: string;
  badge?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  searchable,
  id,
}: {
  value: string | number;
  onChange: (value: string) => void;
  options: (SelectOption | { value: string | number; label: string })[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const shouldSearch = searchable ?? options.length > 5;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    );
  }, [options, search]);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const idx = filteredOptions.findIndex((o) => String(o.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [open, filteredOptions, value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Tab") {
        setOpen(false);
        setSearch("");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const target = filteredOptions[highlightedIndex];
          if (!("disabled" in target && target.disabled)) {
            onChange(String(target.value));
            setOpen(false);
            setSearch("");
          }
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, filteredOptions, highlightedIndex, onChange]);

  useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlightedIndex]);

  useEffect(() => {
    if (open && shouldSearch) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [open, shouldSearch]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden native select for form serialization & native validation */}
      <select
        id={id}
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only pointer-events-none absolute inset-0 opacity-0"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Modern Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left text-sm font-medium transition-all duration-200 shadow-xs ${
          open
            ? "border-emerald-500 ring-4 ring-emerald-500/15"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer"} ${className}`}
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <>
              {"icon" in selectedOption && selectedOption.icon && (
                <span className="shrink-0 text-slate-400">
                  {selectedOption.icon}
                </span>
              )}
              <span className="font-semibold text-navy-950 truncate">
                {selectedOption.label}
              </span>
              {"badge" in selectedOption && selectedOption.badge && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Floating Modern Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl shadow-slate-900/15 flex flex-col"
        >
          {shouldSearch && (
            <div className="p-1 border-b border-slate-100 mb-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search options…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-navy-950 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div ref={listRef} className="overflow-y-auto max-h-52 space-y-0.5 overscroll-contain pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = highlightedIndex === index;
                const isDisabled = "disabled" in opt && opt.disabled;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      onChange(String(opt.value));
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      isSelected
                        ? isHighlighted
                          ? "bg-emerald-100/80 text-emerald-950 font-bold"
                          : "bg-emerald-50 text-emerald-950 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 text-navy-950"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-navy-950"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {"icon" in opt && opt.icon && (
                        <span className="shrink-0">{opt.icon}</span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {"badge" in opt && opt.badge && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {opt.badge}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
