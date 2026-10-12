"use client";

import { FormEvent, useState } from "react";
import { FileUp } from "lucide-react";
import { apiForm } from "@/lib/api-client";
import { FormModal, TextField } from "@/features/admin/AdminChrome";
import { CollectionAccounts } from "@/features/finance/CollectionAccounts";

export function ActivationRequestModal({
  open,
  token,
  retailerId,
  onClose,
  onSubmitted,
  onError,
}: {
  open: boolean;
  token: string | null;
  retailerId: string;
  onClose: () => void;
  onSubmitted: () => void;
  onError: (err: unknown) => void;
}) {
  const [amount, setAmount] = useState("5000");
  const [utr, setUtr] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || !file || busy) return;
    const form = new FormData();
    form.set("retailerId", retailerId);
    form.set("amount", amount);
    form.set("utr", utr.trim());
    form.set("remarks", remarks.trim());
    form.set("proof", file);
    setBusy(true);
    try {
      await apiForm("/api/v1/finance/activation-requests", form, { token });
      setUtr("");
      setRemarks("");
      setFile(null);
      onSubmitted();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal
      open={open}
      title="Request activation"
      description="Enter the payment the retailer made, attach the proof, and send it to the auditor."
      onClose={onClose}
      onSubmit={submit}
      submitLabel={busy ? "Submitting…" : "Submit request"}
      submitDisabled={busy || !file || !amount || utr.trim().length < 6}
    >
      <CollectionAccounts token={token} compact />
      <TextField label="Amount" required inputMode="numeric" value={amount} onChange={setAmount} />
      <TextField label="UTR" required value={utr} onChange={setUtr} />
      <TextField label="Remarks" value={remarks} onChange={setRemarks} />
      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment proof</span>
        <span className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
          <FileUp className="h-4 w-4 text-slate-400" />
          <input
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-950 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          />
        </span>
      </label>
    </FormModal>
  );
}
