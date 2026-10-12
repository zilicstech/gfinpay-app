"use client";

import { FormEvent, useEffect, useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";

export type PayoutAccount = {
  id: string;
  account_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  active?: boolean;
};

const empty = {
  accountName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
};

export function RetailerBanksDesk({ embedded = false }: { embedded?: boolean }) {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [rows, setRows] = useState<PayoutAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PayoutAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

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
    setOpen(true);
  }

  function startEdit(row: PayoutAccount) {
    setEditing(row);
    setForm({
      accountName: row.account_name,
      accountNumber: row.account_number,
      ifsc: row.ifsc,
      bankName: row.bank_name,
    });
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      await api(editing ? `/api/v1/wallet/banks/${editing.id}` : "/api/v1/wallet/banks", {
        token,
        method: "POST",
        body: JSON.stringify(form),
      });
      setOpen(false);
      flash.ok(editing ? "Bank account updated." : "Bank account added.");
      await load();
    } catch (err) {
      flash.fail(err, "Could not save the bank account");
    } finally {
      setBusy(false);
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
            Accounts where your earnings are transferred when a withdrawal is approved.
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={startCreate}>
          <Plus className="h-4 w-4" /> Add bank
        </button>
      </div>
      <Flash message={flash.message} error={flash.error} />
      {rows.length === 0 ? (
        <EmptyState title="No bank accounts" body="Add the account that should receive your withdrawals." />
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
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
      </FormModal>
    </div>
  );
}
