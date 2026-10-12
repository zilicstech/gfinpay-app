"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight,
  Car, 
  CheckCircle2, 
  Copy, 
  CreditCard, 
  Droplets, 
  Flame, 
  Lightbulb, 
  Phone, 
  Printer, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Smartphone, 
  Tv, 
  Wifi, 
  Zap 
} from "lucide-react";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, Modal } from "@/components/ui/primitives";
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
  const [flowOpen, setFlowOpen] = useState(false);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [paramsLoading, setParamsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<Category[]>("/api/v1/bills/categories", { token })
      .then(setCategories)
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
    if (category?.id === next.id) {
      setFlowOpen(true);
      return;
    }
    setCategory(next);
    resetFromCategory();
    setFlowOpen(true);
    if (!token) return;
    if (next.locationRequired) {
      try {
        const rows = await api<Location[]>("/api/v1/bills/locations", { token });
        setLocations(Array.isArray(rows) ? rows : []);
      } catch (e) {
        flash.fail(e, "Could not load states");
      }
      return;
    }
    await loadOperators(next.id);
  }

  async function loadOperators(categoryId: number, loc?: number) {
    if (!token) return;
    setOperatorsLoading(true);
    try {
      const qs = new URLSearchParams({ categoryId: String(categoryId) });
      if (loc != null) qs.set("locationId", String(loc));
      const rows = await api<Operator[]>(`/api/v1/bills/operators?${qs}`, { token });
      setOperators(Array.isArray(rows) ? rows : []);
      setOperator(null);
      setParams([]);
      setFields({});
      setBill(null);
    } catch (e) {
      setOperators([]);
      flash.fail(e, "Could not load billers");
    } finally {
      setOperatorsLoading(false);
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
    setOperatorQuery("");
    if (!token || !category) return;
    setParamsLoading(true);
    try {
      const qs = new URLSearchParams({
        operatorId: String(next.id),
        categoryId: String(category.id),
      });
      const p = await api<Param[]>(`/api/v1/bills/parameters?${qs}`, { token });
      setParams(Array.isArray(p) ? p : []);
    } catch (e) {
      flash.fail(e, "Could not load the account form for this biller");
    } finally {
      setParamsLoading(false);
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
        idempotencyKey: crypto.randomUUID(),
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
      setFlowOpen(false);
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
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-950">
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
              className="flex-1 rounded-xl bg-navy-950 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-navy-900 transition-colors"
              onClick={() => openDetails(`/agent/transactions/${receipt.transactionId}`, router.push)}
            >
              View Transaction Record
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-navy-950 hover:bg-slate-100 transition-colors"
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

  if (categories.length === 0 && !loadError) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-36 rounded-[2.5rem] animate-pulse bg-slate-100" />
        <div className="h-64 rounded-3xl animate-pulse bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Utility & Bill Payments
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BBPS Live Terminal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display text-white tracking-tight">
              Bharat BillPay Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Instant clearing and receipt generation for electricity, water, gas, broadband, FASTag, and mobile postpaid across India.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/agent/transactions"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors border border-white/10 backdrop-blur-xs"
            >
              <span>Bill History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {!flowOpen && <Flash message={flash.message} error={flash.error} />}

      {/* Step 1: Select Bill Category */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">
                1
              </span>
              Select Utility Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a category. State, biller, and payment continue in the window that opens.
            </p>
          </div>

          {category && !flowOpen && (
            <button
              type="button"
              onClick={() => setFlowOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 w-fit"
            >
              Continue {category.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
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
                    : "border-slate-200/80 bg-slate-50/50 text-navy-900 hover:border-emerald-500/40 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl mb-2.5 transition-all duration-300 group-hover:scale-110 ${
                  isSelected 
                    ? "bg-white/10 text-emerald-400" 
                    : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200/80 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white"
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

      {category && (
        <Modal
          open={flowOpen}
          wide
          title={operator ? operator.name : category.name}
          description={operator
            ? "Enter the account from the customer's bill, fetch the amount, then pay from this window."
            : "Choose the state and biller. The account and payment steps stay in this window."}
          onClose={() => setFlowOpen(false)}
        >
          <div className="space-y-5">
            <Flash message={flash.message} error={flash.error} />

            {!operator ? (
              <div className="space-y-4">
                {category.locationRequired && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      State / circle
                    </label>
                    <select
                      value={locationId}
                      onChange={(e) => onLocation(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Select state</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(!category.locationRequired || locationId) && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Biller
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search billers"
                        value={operatorQuery}
                        onChange={(e) => setOperatorQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      {operatorsLoading ? (
                        <p className="p-4 text-center text-xs text-slate-500">Loading billers…</p>
                      ) : operators.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">No billers for this selection.</p>
                      ) : filteredOperators.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">No billers match that search.</p>
                      ) : (
                        filteredOperators.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => pickOperator(o)}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-navy-900 hover:bg-white"
                          >
                            <span className="truncate pr-2">{o.name}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {category.locationRequired && !locationId && (
                  <p className="text-sm text-slate-500">Select a state to see the billers for this category.</p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {category.name}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-bold text-navy-700 underline"
                    onClick={() => {
                      setOperator(null);
                      setParams([]);
                      setFields({});
                      setBill(null);
                      flash.clear();
                    }}
                  >
                    Change biller
                  </button>
                </div>

                {paramsLoading ? (
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                ) : params.length === 0 ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-navy-700 underline"
                    onClick={() => pickOperator(operator)}
                  >
                    Retry loading the account form
                  </button>
                ) : (
                  <form onSubmit={onFetch} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {params.map((p) => (
                        <div key={p.name}>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            {p.label} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            required
                            value={fields[p.name] ?? ""}
                            onChange={(e) => setFields((prev) => ({ ...prev, [p.name]: e.target.value }))}
                            inputMode={p.type === "Numeric" ? "numeric" : "text"}
                            placeholder={`Enter ${p.label}`}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          {p.errorMessage && <p className="mt-1 text-[11px] text-slate-400">{p.errorMessage}</p>}
                        </div>
                      ))}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Customer mobile <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            inputMode="numeric"
                            maxLength={10}
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="10-digit mobile"
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Name on receipt
                        </label>
                        <input
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-950 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl bg-navy-950 px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {busy && !bill ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                          Fetching bill…
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 text-emerald-400" />
                          Fetch bill
                        </>
                      )}
                    </button>
                  </form>
                )}

                {bill && (
                  <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4" /> Bill fetched
                        </span>
                        <p className="mt-3 text-lg font-bold text-navy-950">
                          {bill.customerName || senderName || "Account holder"}
                        </p>
                        {bill.dueDate && (
                          <p className="mt-1 text-xs font-semibold text-rose-600">Due {bill.dueDate}</p>
                        )}
                      </div>
                      <div className="rounded-2xl bg-navy-950 px-5 py-4 text-right text-white">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Payable</p>
                        <p className="font-display text-3xl font-extrabold">{inr(bill.amount)}</p>
                      </div>
                    </div>
                    {bill.payEnabled ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onPay}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-navy-950 disabled:opacity-50"
                      >
                        {busy ? "Processing…" : `Pay ${inr(bill.amount)}`}
                      </button>
                    ) : (
                      <Alert tone="info">This bill can be fetched. Live payment is not enabled for this category.</Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
