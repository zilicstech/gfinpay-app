"use client";

import { FormEvent, useEffect, useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { api, apiForm, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import type { CollectionAccount } from "@/features/finance/CollectionAccounts";

type BankRow = CollectionAccount & { qr_filename?: string | null };

const empty = {
  accountName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  upiId: "",
};

export function BanksDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<BankRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BankRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<BankRow[]>("/api/v1/admin/banks", { token });
    setRows(data);
  }

  useEffect(() => {
    if (!token) return;
    load().catch((e) => setError(formatApiError(e, "Could not load bank accounts")));
  }, [token]);

  function startCreate() {
    setEditing(null);
    setForm(empty);
    setFile(null);
    setOpen(true);
  }

  function startEdit(row: BankRow) {
    setEditing(row);
    setForm({
      accountName: row.account_name,
      accountNumber: row.account_number,
      ifsc: row.ifsc,
      bankName: row.bank_name,
      upiId: row.upi_id ?? "",
    });
    setFile(null);
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const body = new FormData();
    body.set("accountName", form.accountName.trim());
    body.set("accountNumber", form.accountNumber.trim());
    body.set("ifsc", form.ifsc.trim());
    body.set("bankName", form.bankName.trim());
    if (form.upiId.trim()) body.set("upiId", form.upiId.trim());
    if (!editing) body.set("active", "true");
    if (file) body.set("qr", file);
    setBusy(true);
    try {
      await apiForm(editing ? `/api/v1/admin/banks/${editing.id}` : "/api/v1/admin/banks", body, { token });
      setOpen(false);
      flash.ok(editing ? "Bank account updated." : "Bank account added.");
      await load();
    } catch (err) {
      flash.fail(err, "Could not save the bank account");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: BankRow) {
    try {
      await api(`/api/v1/admin/banks/${row.id}/active`, {
        token,
        method: "POST",
        body: JSON.stringify({ active: !row.active }),
      });
      flash.ok(row.active ? "Bank account marked inactive." : "Bank account marked active.");
      await load();
    } catch (err) {
      flash.fail(err, "Could not change the bank account");
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!rows) return <div className="card h-48 animate-pulse bg-[#f5f5f5]" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded && <h1 className="font-display text-2xl font-bold text-navy-950">Banks</h1>}
          <p className={`${embedded ? "" : "mt-1 "}text-sm text-navy-600`}>
            Collection accounts retailers use when they add wallet money and submit payment proof.
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={startCreate}>
          <Plus className="h-4 w-4" /> Add bank
        </button>
      </div>
      <Flash message={flash.message} error={flash.error} />
      {rows.length === 0 ? (
        <EmptyState title="No bank accounts" body="Add the account retailers should transfer to." />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-navy-800">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy-950">{row.bank_name}</p>
                      <StatusPill value={row.active ? "ACTIVE" : "INACTIVE"} />
                    </div>
                    <p className="text-sm text-slate-600">{row.account_name}</p>
                    <p className="mt-1 font-mono text-sm text-navy-950">{row.account_number}</p>
                    <p className="font-mono text-xs text-slate-500">IFSC {row.ifsc}</p>
                    {row.upi_id && <p className="text-xs text-navy-800">UPI {row.upi_id}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {row.qr_url && (
                    <img src={row.qr_url} alt="" className="h-16 w-16 rounded-lg bg-slate-50 object-contain ring-1 ring-slate-200" />
                  )}
                  <button type="button" className="btn-secondary text-sm" onClick={() => startEdit(row)}>Edit</button>
                  <button type="button" className="btn-secondary text-sm" onClick={() => toggle(row)}>
                    {row.active ? "Mark inactive" : "Mark active"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <FormModal
        open={open}
        title={editing ? "Edit bank account" : "Add bank account"}
        onClose={() => setOpen(false)}
        onSubmit={save}
        submitLabel={busy ? "Saving…" : "Save"}
        submitDisabled={busy || !form.accountName || !form.accountNumber || !form.ifsc || !form.bankName}
      >
        <TextField label="Account name" required value={form.accountName} onChange={(accountName) => setForm({ ...form, accountName })} />
        <TextField label="Account number" required value={form.accountNumber} onChange={(accountNumber) => setForm({ ...form, accountNumber })} />
        <TextField label="IFSC" required value={form.ifsc} onChange={(ifsc) => setForm({ ...form, ifsc })} />
        <TextField label="Bank" required value={form.bankName} onChange={(bankName) => setForm({ ...form, bankName })} />
        <TextField label="UPI id" value={form.upiId} onChange={(upiId) => setForm({ ...form, upiId })} placeholder="name@bank" />
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">QR code</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-950 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          />
          <span className="block text-[11px] text-slate-400">
            {editing?.qr_filename && !file ? `Current file: ${editing.qr_filename}` : "PNG, JPG, or WebP"}
          </span>
        </label>
      </FormModal>
    </div>
  );
}
