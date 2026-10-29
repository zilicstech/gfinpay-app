"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Briefcase, FileSpreadsheet, HeartPulse, Phone, Search, Store, UploadCloud } from "lucide-react";
import { api, apiForm } from "@/lib/api-client";
import { API_BASE } from "@/lib/api-base";
import { inr, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, Field, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, useFlash } from "@/features/admin/AdminChrome";

type Sale = {
  id: string;
  gfin_sale_code: string;
  customer_name: string;
  mobile: string;
  state: string;
  sale_channel: string;
  vendor_payment_status: string;
  activation_status?: string;
  vendor_name?: string;
  vendor_code?: string;
  retailer_name?: string;
  retailer_code?: string;
  employee_name?: string;
  premium_amount: number;
  created_at?: string;
  partner_policy_ref?: string;
};

type Earning = {
  id: string;
  vendor_name?: string;
  gfin_sale_code: string;
  customer_name: string;
  amount: number;
  settled_at?: string | null;
};

type Recon = {
  activated: number;
  rejected: number;
  skipped: number;
  pending: number;
  unpaid: number;
  unmatched: number;
};

type Tab = "PENDING" | "SUCCESS" | "FAILED";

function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function paymentLabel(status: string) {
  if (status === "UNPAID") return "Unpaid";
  return "Collected";
}

function activationOf(row: Sale) {
  if (row.activation_status === "SUCCESS" || row.activation_status === "FAILED") return row.activation_status;
  return "PENDING";
}

function activationLabel(status?: string) {
  if (status === "SUCCESS") return "Success";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

function channelBadge(channel?: string) {
  if (channel === "EXTERNAL") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-500/25 whitespace-nowrap">
        <Briefcase className="h-3 w-3 text-amber-600 shrink-0" />
        Vendor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-500/25 whitespace-nowrap">
      <Store className="h-3 w-3 text-indigo-600 shrink-0" />
      Retailer
    </span>
  );
}

export default function AdminHospiCashPage() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [from, setFrom] = useState(todayInput);
  const [to, setTo] = useState(todayInput);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Sale[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(status = tab, start = from, end = to) {
    if (!token) return;
    if (!start || !end || start > end) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ activation: status, from: start, to: end });
      const [sales, vendorEarnings] = await Promise.all([
        api<Sale[]>(`/api/v1/admin/hospi-cash?${params}`, { token }),
        api<Earning[]>("/api/v1/admin/hospi-cash/earnings", { token }),
      ]);
      setRows(Array.isArray(sales) ? sales : []);
      setEarnings(Array.isArray(vendorEarnings) ? vendorEarnings : []);
    } catch (e) {
      flash.fail(e, "Could not load Hospi Cash sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load(tab, from, to);
  }, [token, tab, from, to]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      row.gfin_sale_code.toLowerCase().includes(q) ||
      row.customer_name.toLowerCase().includes(q) ||
      row.mobile.includes(q) ||
      (row.retailer_name ?? "").toLowerCase().includes(q) ||
      (row.retailer_code ?? "").toLowerCase().includes(q) ||
      (row.vendor_name ?? "").toLowerCase().includes(q) ||
      (row.vendor_code ?? "").toLowerCase().includes(q) ||
      (row.employee_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const hasAction = visible.some((row) => row.sale_channel === "EXTERNAL" && row.vendor_payment_status === "UNPAID");

  function closeUpload() {
    setUploadOpen(false);
    setFile(null);
  }

  async function download() {
    if (!token || !from || !to || from > to) return;
    setBusy(true);
    try {
      const params = new URLSearchParams({ activation: tab, from, to });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`${API_BASE}/api/v1/admin/hospi-cash/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Could not download the workbook");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hospi-cash-${tab.toLowerCase()}-${from}-${to}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      flash.ok("Workbook downloaded for the selected dates and status.");
    } catch (e) {
      flash.fail(e, "Could not download the workbook");
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id: string) {
    try {
      await api(`/api/v1/admin/hospi-cash/${id}/vendor-payment`, { method: "POST", token });
      flash.ok("Vendor payment marked collected. Activation stays pending until the recon sheet says otherwise.");
      await load();
    } catch (e) {
      flash.fail(e, "Could not mark the vendor payment");
    }
  }

  async function recon(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const result = await apiForm<Recon>("/api/v1/admin/hospi-cash/recon", body, { token });
      flash.ok(
        `Success ${result.activated}, failed ${result.rejected}, pending ${result.pending ?? 0}, skipped ${result.skipped}, unpaid ${result.unpaid ?? 0}, unmatched ${result.unmatched}.`,
      );
      closeUpload();
      await load();
    } catch (e) {
      flash.fail(e, "Could not import recon");
    } finally {
      setBusy(false);
    }
  }

  async function settle(id: string) {
    try {
      await api(`/api/v1/admin/hospi-cash/earnings/${id}/settle`, { method: "POST", token });
      flash.ok("Vendor earning marked settled.");
      await load();
    } catch (e) {
      flash.fail(e, "Could not settle the vendor earning");
    }
  }

  const tabs = [
    ["PENDING", "Pending"],
    ["SUCCESS", "Success"],
    ["FAILED", "Failed"],
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Product Pipeline
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Hospi Cash
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Collect vendor payment here. Activation is set from the recon sheet: Pending, Success, or Failed. Commission is generated only for Success.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setUploadOpen(true)}
          >
            <UploadCloud className="h-4 w-4" />
            Upload recon
          </button>
        </div>
      </div>

      <Flash message={flash.message} error={flash.error} />

      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-slate-600">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="field mt-1 block text-xs"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="field mt-1 block text-xs"
              />
            </label>
            {from && to && from <= to && (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={busy}
                onClick={download}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {busy ? "Preparing…" : "Download Excel"}
              </button>
            )}
          </div>
          {from && to && from > to && (
            <p className="text-xs font-semibold text-rose-700">The end date is before the start date.</p>
          )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  tab === key ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[18rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, sale, retailer, vendor..."
              className="field !pl-10 !py-2 text-xs w-full"
            />
          </div>
        </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title="No Hospi Cash cards found"
            body={query ? "Try clearing search." : "No cards in this status for the selected dates."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Card</th>
                  <th className="px-6 py-4">Party</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Activation</th>
                  <th className="px-6 py-4">Created On</th>
                  {hasAction && <th className="px-6 py-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => {
                  const external = row.sale_channel === "EXTERNAL";
                  const partyName = external ? row.vendor_name ?? "Vendor" : row.retailer_name ?? "Retailer";
                  const partyCode = external ? row.vendor_code : row.retailer_code;
                  const activation = activationOf(row);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1.5">
                          {channelBadge(row.sale_channel)}
                          <span className="font-mono text-[11px] text-slate-600">{partyCode || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 shrink-0">
                            <HeartPulse className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-semibold text-navy-950 text-sm">{row.customer_name}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">{row.gfin_sale_code}</p>
                            {row.mobile && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-mono text-[11px]">+91 {row.mobile}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1.5">
                          {external ? (
                            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          ) : (
                            <Store className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-navy-900">{partyName}</p>
                            {external && row.employee_name && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">{row.employee_name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill
                          value={row.vendor_payment_status === "UNPAID" ? "UNPAID" : "COLLECTED"}
                          label={paymentLabel(row.vendor_payment_status)}
                        />
                        <p className="mt-1 font-mono text-[11px] text-slate-400">{inr(row.premium_amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={activation} label={activationLabel(activation)} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{row.created_at ? when(row.created_at) : "—"}</td>
                      {hasAction && (
                        <td className="px-6 py-4 text-right">
                          {external && row.vendor_payment_status === "UNPAID" ? (
                            <button
                              type="button"
                              onClick={() => markPaid(row.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                            >
                              Mark collected
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-navy-950">Vendor earnings</h2>
          <p className="mt-1 text-sm text-slate-500">
            A vendor earning is written only when the recon sheet marks that card Success. Settlement stays offline.
          </p>
        </div>
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : earnings.length === 0 ? (
          <EmptyState
            title="No vendor earnings"
            body="A Success status on a collected vendor card writes the earning."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Sale</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Settled</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold text-navy-950 text-sm">{row.vendor_name ?? "Vendor"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{row.gfin_sale_code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.customer_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{inr(row.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusPill value={row.settled_at ? "COLLECTED" : "UNPAID"} label={row.settled_at ? "Settled" : "Open"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.settled_at ? (
                        <span className="font-mono text-[11px] text-slate-400">{when(row.settled_at)}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => settle(row.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Mark settled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        open={uploadOpen}
        title="Upload Hospi Cash recon"
        description="Upload the same activation workbook. Status must be Pending, Success, or Failed. Success generates commission. Failed does not."
        onClose={closeUpload}
        onSubmit={recon}
        submitLabel={busy ? "Importing…" : "Start reconciliation"}
        submitDisabled={!file || busy}
      >
        <Field label="Upload Excel document (.xlsx)">
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50">
            <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <input
              key={uploadOpen ? "open" : "closed"}
              type="file"
              required
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-950 file:text-white hover:file:bg-slate-800"
            />
            {file && (
              <p className="mt-2 text-xs font-bold text-emerald-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </Field>
      </FormModal>
    </div>
  );
}
