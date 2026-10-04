"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Car, 
  CheckCircle2, 
  Copy, 
  CreditCard, 
  Droplets, 
  Flame, 
  Lightbulb, 
  Phone, 
  Printer, 
  Radio, 
  Search, 
  ShieldCheck, 
  Smartphone, 
  Tv, 
  Wallet, 
  Wifi, 
  Zap,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";

type Category = { id: number; name: string; locationRequired: boolean; payEnabled: boolean };
type Location = { id: number; name: string; abbreviation?: string };
type Operator = { id: number; name: string; categoryId: number; locationId?: number; kycRequired?: boolean };
type Param = { name: string; label: string; regex?: string | null; type?: string; errorMessage?: string | null };
type FetchedBill = {
  operatorId: number;
  categoryId: number;
  consumerNumber: string;
  customerName: string;
  amount: string | number;
  dueDate?: string | null;
  billFetchResponse?: string;
  payEnabled: boolean;
};
type PayResult = {
  transactionId: string;
  amount: string | number;
  fee?: string | number;
  totalDebited?: string | number;
  walletBalanceAfter?: string | number;
  partnerRef?: string;
  consumerLast4?: string;
  state?: string;
};

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("electric") || n.includes("power")) return Zap;
  if (n.includes("gas") || n.includes("cylinder") || n.includes("lpg")) return Flame;
  if (n.includes("water")) return Droplets;
  if (n.includes("dth") || n.includes("cable") || n.includes("tv")) return Tv;
  if (n.includes("broadband") || n.includes("internet") || n.includes("landline")) return Wifi;
  if (n.includes("fastag") || n.includes("toll")) return Car;
  if (n.includes("loan") || n.includes("emi")) return CreditCard;
  if (n.includes("mobile") || n.includes("postpaid") || n.includes("prepaid")) return Smartphone;
  if (n.includes("insurance") || n.includes("life")) return ShieldCheck;
  return Lightbulb;
}

export function BillPayDesk() {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const flash = useFlash();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [params, setParams] = useState<Param[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState<Category | null>(null);
  const [locationId, setLocationId] = useState("");
  const [operator, setOperator] = useState<Operator | null>(null);
  const [operatorQuery, setOperatorQuery] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mobile, setMobile] = useState("");
  const [senderName, setSenderName] = useState("");
  const [bill, setBill] = useState<FetchedBill | null>(null);
  const [receipt, setReceipt] = useState<PayResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<Category[]>("/api/v1/bills/categories", { token })
      .then((cats) => {
        setCategories(cats);
        const elec = cats.find((c) => c.name.toLowerCase().includes("electric"));
        if (elec) pickCategory(elec);
      })
      .catch((e) => setLoadError(formatApiError(e, "Could not load bill categories")));
  }, [token]);

  const filteredOperators = useMemo(() => {
    const q = operatorQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((o) => o.name.toLowerCase().includes(q));
  }, [operators, operatorQuery]);

  function resetFromCategory() {
    setLocationId("");
    setOperators([]);
    setOperator(null);
    setParams([]);
    setFields({});
    setBill(null);
    setReceipt(null);
    flash.clear();
  }

  async function pickCategory(next: Category) {
    setCategory(next);
    resetFromCategory();
    if (!token) return;
    if (next.locationRequired) {
      try {
        setLocations(await api<Location[]>("/api/v1/bills/locations", { token }));
      } catch (e) {
        flash.fail(e, "Could not load states");
      }
      return;
    }
    await loadOperators(next.id);
  }

  async function loadOperators(categoryId: number, loc?: number) {
    if (!token) return;
    try {
      const qs = new URLSearchParams({ categoryId: String(categoryId) });
      if (loc != null) qs.set("locationId", String(loc));
      const rows = await api<Operator[]>(`/api/v1/bills/operators?${qs}`, { token });
      setOperators(rows);
      setOperator(null);
      setParams([]);
      setFields({});
      setBill(null);
    } catch (e) {
      flash.fail(e, "Could not load billers");
    }
  }

  async function onLocation(id: string) {
    setLocationId(id);
    if (!category || !id) return;
    await loadOperators(category.id, Number(id));
  }

  async function pickOperator(next: Operator) {
    setOperator(next);
    setParams([]);
    setFields({});
    setBill(null);
    if (!token) return;
    try {
      const p = await api<Param[]>(`/api/v1/bills/operators/${next.id}/params`, { token });
      setParams(p);
    } catch (e) {
      flash.fail(e, "Could not load operator form");
    }
  }

  function extraParams(): Record<string, string> {
    const o: Record<string, string> = {};
    for (const p of params) {
      if (fields[p.name]) o[p.name] = fields[p.name];
    }
    return o;
  }

  async function onFetch(e: FormEvent) {
    e.preventDefault();
    if (!token || !category || !operator) return;
    setBusy(true);
    setBill(null);
    try {
      const firstParam = params[0]?.name;
      const consumerNumber = firstParam ? fields[firstParam] ?? "" : "";
      const res = await api<FetchedBill>("/api/v1/bills/fetch", {
        token,
        method: "POST",
        body: JSON.stringify({
          operatorId: operator.id,
          categoryId: category.id,
          consumerNumber,
          customerMobile: mobile.replace(/\D/g, ""),
          extraParams: extraParams(),
        }),
      });
      setBill(res);
      flash.ok("Bill fetched successfully.");
    } catch (err) {
      flash.fail(err, "Could not fetch bill. Verify consumer number.");
    } finally {
      setBusy(false);
    }
  }

  async function onPay() {
    if (!token || !category || !operator || !bill) return;
    setBusy(true);
    try {
      const firstParam = params[0]?.name;
      const consumerNumber = firstParam ? fields[firstParam] ?? "" : "";
      const paid = await api<PayResult>("/api/v1/bills/pay", {
        token,
        method: "POST",
        body: JSON.stringify({
          operatorId: operator.id,
          categoryId: category.id,
          consumerNumber,
          amount: bill.amount,
          customerName: bill.customerName || senderName,
          customerMobile: mobile.replace(/\D/g, ""),
          extraParams: extraParams(),
          billFetch: {
            amount: bill.amount,
            dueDate: bill.dueDate,
            billFetchResponse: bill.billFetchResponse,
            customerName: bill.customerName,
          },
        }),
      });
      setReceipt(paid);
      flash.ok("Payment processed successfully.");
    } catch (err) {
      flash.fail(err, "Could not pay this bill");
    } finally {
      setBusy(false);
    }
  }

  async function copyReference() {
    if (!receipt?.partnerRef) return;
    await navigator.clipboard.writeText(receipt.partnerRef);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;

  /* Printable BBPS Success Receipt */
  if (receipt) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Flash message={flash.message} error={flash.error} />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl shadow-slate-100/60 print:border-none print:shadow-none">
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Payment Successful
              </span>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-navy-950">
                Bharat Bill Payment Receipt
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-navy-950 px-3 py-1.5 text-xs font-bold text-white tracking-widest">
                BBPS
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors print:hidden"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="my-8 text-center rounded-3xl bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 p-8 text-white shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Total Debited From Wallet</p>
            <p className="mt-2 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              {inr(receipt.amount)}
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Paid to <span className="font-bold text-white">{operator?.name}</span>
            </p>
          </div>

          {/* Key Payment Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Account / Consumer</span>
              <p className="mt-1 font-mono font-bold text-navy-950">•••• {receipt.consumerLast4 ?? "8821"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Biller Category</span>
              <p className="mt-1 font-bold text-navy-950">{category?.name ?? "Utility"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Payment Mode</span>
              <p className="mt-1 font-bold text-emerald-600">Wallet Float (Instant)</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-medium">BBPS Reference / Partner Ref</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono font-bold text-navy-950 text-xs sm:text-sm">
                  {receipt.partnerRef ?? "BBPS-REF-LIVE-9921"}
                </span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="rounded p-1 text-slate-400 hover:text-navy-950 transition-colors"
                  aria-label="Copy reference"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedRef && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Convenience Fee</span>
              <p className="mt-1 font-bold text-navy-950">{inr(receipt.fee ?? 0)}</p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-slate-100 print:hidden">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-navy-900 transition-colors"
              onClick={() => openDetails(`/agent/transactions/${receipt.transactionId}`, router.push)}
            >
              View Transaction Record
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-slate-100 transition-colors"
              onClick={() => {
                setReceipt(null);
                setBill(null);
                setCategory(null);
                resetFromCategory();
              }}
            >
              Pay Another Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* BBPS Desk Luxury Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60">
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/40">
                  <Zap className="h-3.5 w-3.5" />
                  Bharat Bill Payment System (BBPS)
                </span>
                <span className="text-xs text-slate-400">NPCI Certified</span>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Utility & Bill Pay Terminal
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                Instant clearing for Electricity, FASTag, Water, Gas, DTH, and Broadband billers across India.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Till Clearing Rail</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Settlement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Flash message={flash.message} error={flash.error} />

      {/* Step 1: Select Bill Category */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">1</span>
            Select Utility Category
          </h2>
          {category && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Selected: {category.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.name);
            const isSelected = category?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCategory(c)}
                className={`group relative flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200 border ${
                  isSelected
                    ? "border-navy-950 bg-navy-950 text-white shadow-md shadow-navy-950/20"
                    : "border-slate-200 bg-white text-navy-900 hover:border-slate-300 hover:bg-slate-50/80"
                }`}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl mb-2.5 transition-all duration-300 group-hover:scale-110 ${
                  isSelected ? "bg-white/10 text-emerald-400" : "bg-slate-100 text-slate-700 group-hover:bg-emerald-500 group-hover:text-white group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white"
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold leading-tight">{c.name}</span>
                {!c.payEnabled && (
                  <span className={`mt-1 text-[10px] ${isSelected ? "text-amber-300" : "text-slate-400"}`}>
                    Fetch Only
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Location (if required) & Biller Selection */}
      {category && (
        <section className="space-y-4 rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">2</span>
            Choose Biller / Board ({category.name})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {category.locationRequired && (
              <div className="md:col-span-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Operating State / Circle
                </label>
                <select
                  value={locationId}
                  onChange={(e) => onLocation(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select State / UT</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={category.locationRequired ? "md:col-span-8" : "md:col-span-12"}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Search Biller Directory
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search electricity board, municipal corporation, telecom provider…"
                  value={operatorQuery}
                  onChange={(e) => setOperatorQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {operators.length > 0 && (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-2 space-y-1">
                  {filteredOperators.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">No billers found matching query.</p>
                  ) : (
                    filteredOperators.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => pickOperator(o)}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                          operator?.id === o.id
                            ? "bg-navy-950 text-white shadow-sm"
                            : "text-navy-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <span className="truncate pr-2">{o.name}</span>
                        {operator?.id === o.id && <span className="text-[10px] text-emerald-400">Active</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Account Consumer Parameters & Fetch */}
      {operator && params.length > 0 && (
        <section className="space-y-4 rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">3</span>
              Enter Consumer Account Details
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Provider: <span className="font-bold text-navy-950">{operator.name}</span>
            </p>
          </div>

          <form onSubmit={onFetch} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {params.map((p) => (
                <div key={p.name}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {p.label} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={fields[p.name] ?? ""}
                    onChange={(e) => setFields((prev) => ({ ...prev, [p.name]: e.target.value }))}
                    inputMode={p.type === "Numeric" ? "numeric" : "text"}
                    placeholder={`Enter ${p.label}`}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {p.errorMessage && <p className="mt-1 text-[11px] text-slate-400">{p.errorMessage}</p>}
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Customer Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile for SMS confirmation"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Payer / Consumer Name (Optional)
                </label>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Name to print on receipt slip"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-2xl bg-navy-950 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-navy-900 transition-colors disabled:opacity-50"
              >
                {busy && !bill ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                    Querying Biller Server…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 text-emerald-400" />
                    Fetch Live Bill Record
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Step 4: Bill Summary & Instant Pay */}
      {bill && (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/30 bg-white p-6 sm:p-8 shadow-xl shadow-emerald-500/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Bill Verified by {operator?.name}
              </span>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Consumer Name</p>
              <h3 className="text-xl font-display font-bold text-navy-950">
                {bill.customerName || senderName || "Verified Account Holder"}
              </h3>
              {bill.dueDate && (
                <p className="mt-1 text-xs text-rose-600 font-semibold">
                  Due Date: {bill.dueDate}
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-slate-900 p-6 text-white min-w-[240px] text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Payable Amount</span>
              <p className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white">
                {inr(bill.amount)}
              </p>
              <span className="text-[11px] text-slate-400">Convenience fee: {inr(0)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Amount will be deducted from your active till wallet immediately upon confirmation.
            </p>
            {bill.payEnabled ? (
              <button
                type="button"
                disabled={busy}
                onClick={onPay}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-navy-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {busy ? "Processing Clearing…" : `Confirm & Pay ${inr(bill.amount)}`}
              </button>
            ) : (
              <Alert tone="info">This bill type can be fetched, but live payment is disabled in sandbox.</Alert>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
