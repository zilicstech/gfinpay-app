"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Building2, Landmark, Plus, ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";

export type BankIfscDetails = {
  ifsc?: string;
  micr?: string;
  bank?: string;
  bankCode?: string;
  bankName?: string;
  branch?: string;
  centre?: string;
  district?: string;
  state?: string;
  city?: string;
  address?: string;
  imps?: boolean;
  rtgs?: boolean;
  neft?: boolean;
  upi?: boolean;
};

export type PayoutAccount = {
  id: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  account_type?: "SAVINGS" | "CURRENT" | string;
  branch_name?: string | null;
  imps_ref_no?: string | null;
  verification_remarks?: string | null;
  ifsc_details?: BankIfscDetails | null;
  active?: boolean;
  verification_status?: "VERIFIED" | "FAILED" | "NOT_VERIFIED" | string;
  verified_name?: string | null;
  name_match_score?: number | null;
  verified_at?: string | null;
};

const empty = {
  accountNumber: "",
  ifsc: "",
  accountType: "SAVINGS" as "SAVINGS" | "CURRENT",
};

export function RetailerBanksDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const loadProfile = useSession((s) => s.loadProfile);
  const flash = useFlash();
  const [rows, setRows] = useState<PayoutAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PayoutAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  async function load() {
    const data = await api<PayoutAccount[]>("/api/v1/wallet/banks", { token });
    setRows(data);
  }

  useEffect(() => {
    if (!token) return;
    load().catch((e) => setError(formatApiError(e, "Could not load bank accounts")));
  }, [token]);

  function startCreate() {
    setEditing(null);
    setForm(empty);
    setModalError(null);
    setOpen(true);
  }

  function startEdit(row: PayoutAccount) {
    setEditing(row);
    setForm({
      accountNumber: row.account_number,
      ifsc: row.ifsc,
      accountType: row.account_type === "CURRENT" ? "CURRENT" : "SAVINGS",
    });
    setModalError(null);
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setModalError(null);
    try {
      const saved = await api<PayoutAccount>(
        editing ? `/api/v1/wallet/banks/${editing.id}` : "/api/v1/wallet/banks",
        {
          token,
          method: "POST",
          body: JSON.stringify({
            accountNumber: form.accountNumber.replace(/\D/g, ""),
            ifsc: form.ifsc.trim().toUpperCase(),
            accountType: form.accountType,
            verify: true,
          }),
        },
      );
      setOpen(false);
      flash.ok(
        `Bank account verified! Holder: ${saved.verified_name || saved.account_name} · ${saved.bank_name}${saved.branch_name ? ` (${saved.branch_name})` : ""}`,
      );
      await load();
      window.dispatchEvent(new Event("gfin-verification-updated"));
      loadProfile().catch(() => undefined);
    } catch (err) {
      setModalError(formatApiError(err, "Bank verification failed. Check the account number and IFSC code."));
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function verifyBank(row: PayoutAccount) {
    if (!token) return;
    setVerifyingId(row.id);
    try {
      const saved = await api<PayoutAccount>(`/api/v1/wallet/banks/${row.id}/verify`, {
        token,
        method: "POST",
        body: "{}",
      });
      flash.ok(
        `Bank account verified! Holder: ${saved.verified_name || saved.account_name} · ${saved.bank_name}${saved.branch_name ? ` (${saved.branch_name})` : ""}`,
      );
      await load();
      window.dispatchEvent(new Event("gfin-verification-updated"));
      loadProfile().catch(() => undefined);
    } catch (err) {
      flash.fail(err, "Bank account verification failed");
      await load().catch(() => undefined);
    } finally {
      setVerifyingId(null);
    }
  }

  async function toggle(row: PayoutAccount) {
    try {
      await api(`/api/v1/wallet/banks/${row.id}/active`, {
        token,
        method: "POST",
        body: JSON.stringify({ active: !row.active }),
      });
      flash.ok(row.active ? "Bank account marked inactive." : "Bank account marked active.");
      await load();
      window.dispatchEvent(new Event("gfin-verification-updated"));
      loadProfile().catch(() => undefined);
    } catch (err) {
      flash.fail(err, "Could not change the bank account");
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!rows) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  const cleanDigits = form.accountNumber.replace(/\D/g, "");
  const cleanIfsc = form.ifsc.trim().toUpperCase();
  const canSubmit = cleanDigits.length >= 9 && cleanDigits.length <= 18 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {embedded ? (
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy-950">
              <Landmark className="h-5 w-5" />
              Bank Verification &amp; Settlement Accounts
            </h2>
          ) : (
            <h1 className="font-display text-2xl font-bold text-navy-950">Banks</h1>
          )}
          <p className="mt-1 text-sm text-slate-500">
            Enter your account number and IFSC code to instantly verify your bank account and match your holder name.
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={startCreate}>
          <Plus className="h-4 w-4" /> Verify &amp; Add Bank
        </button>
      </div>
      <Flash message={flash.message} error={flash.error} />
      {rows.length === 0 ? (
        <EmptyState
          title="No bank accounts"
          body="Enter your account number and IFSC code to verify and link your settlement bank account."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const isVerified = row.verification_status === "VERIFIED";
            const details = row.ifsc_details || {};
            const branchLine = [
              row.branch_name || details.branch,
              details.city,
              details.state,
            ]
              .filter(Boolean)
              .join(", ");
            const supportedRails = (
              [
                details.imps ? "IMPS" : null,
                details.neft ? "NEFT" : null,
                details.rtgs ? "RTGS" : null,
                details.upi ? "UPI" : null,
              ].filter(Boolean) as string[]
            );

            return (
              <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        isVerified ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-navy-800"
                      }`}
                    >
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-navy-950">{row.bank_name}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          {row.account_type === "CURRENT" ? "CURRENT" : "SAVINGS"}
                        </span>
                        <StatusPill value={row.active ? "ACTIVE" : "INACTIVE"} />
                        <StatusPill value={row.verification_status || "NOT_VERIFIED"} />
                      </div>
                      <p className="text-sm text-slate-600">{row.account_name}</p>
                      {row.verified_name && (
                        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Verified Holder: {row.verified_name}
                            {row.name_match_score != null ? ` (${row.name_match_score}% match)` : ""}
                          </span>
                        </p>
                      )}
                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-sm font-semibold text-navy-950">{row.account_number}</span>
                        <span className="font-mono text-xs text-slate-500">IFSC {row.ifsc}</span>
                        {row.imps_ref_no && (
                          <span className="font-mono text-[11px] text-slate-500">IMPS Ref #{row.imps_ref_no}</span>
                        )}
                      </div>
                      {branchLine && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 pt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Branch: {branchLine}</span>
                        </p>
                      )}
                      {supportedRails.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {supportedRails.map((rail) => (
                            <span
                              key={rail}
                              className="rounded-md border border-emerald-200 bg-emerald-50/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"
                            >
                              {rail}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isVerified && (
                      <button
                        type="button"
                        disabled={verifyingId === row.id}
                        onClick={() => verifyBank(row)}
                        className="btn-primary inline-flex items-center gap-1.5 text-xs"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {verifyingId === row.id ? "Verifying…" : "Verify Bank Account"}
                      </button>
                    )}
                    <button type="button" className="btn-secondary text-xs" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => toggle(row)}>
                      {row.active ? "Mark inactive" : "Mark active"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <FormModal
        open={open}
        title={editing ? "Update & verify bank account" : "Verify & add bank account"}
        onClose={() => {
          if (!busy) {
            setOpen(false);
            setModalError(null);
          }
        }}
        onSubmit={save}
        submitLabel={busy ? "Verifying with Bank…" : "Verify & Save"}
        submitDisabled={busy || !canSubmit}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
          Enter your <strong>Account Number</strong> and <strong>IFSC Code</strong>. We will automatically fetch your bank
          &amp; branch details and verify that the account belongs to your registered name.
        </div>
        {modalError && <Alert tone="error">{modalError}</Alert>}
        <TextField
          label="Account number"
          required
          placeholder="e.g. 219101000000000"
          value={form.accountNumber}
          onChange={(accountNumber) => setForm({ ...form, accountNumber: accountNumber.replace(/\D/g, "").slice(0, 18) })}
        />
        <TextField
          label="IFSC code"
          required
          placeholder="e.g. BARB0DAMOHA"
          value={form.ifsc}
          onChange={(ifsc) => setForm({ ...form, ifsc: ifsc.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })}
        />
        <label className="block text-xs font-semibold text-slate-700">
          Account type <span className="text-rose-600">*</span>
          <select
            className="field mt-1"
            value={form.accountType}
            onChange={(e) => setForm({ ...form, accountType: e.target.value === "CURRENT" ? "CURRENT" : "SAVINGS" })}
          >
            <option value="SAVINGS">Savings Account</option>
            <option value="CURRENT">Current Account</option>
          </select>
        </label>
      </FormModal>
    </div>
  );
}
