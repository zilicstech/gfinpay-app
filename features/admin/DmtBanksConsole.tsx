"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { api, apiForm, formatApiError } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";

type DmtBank = {
  id: string;
  bank_id: string;
  bank_name: string;
  ifsc_alias?: string | null;
  ifsc_global?: string | null;
  imps_enabled?: boolean;
  neft_enabled?: boolean;
  last_synced_at?: string | null;
  synced_at?: string | null;
  active: boolean;
};

type Page = { items: DmtBank[]; total: number };

export function DmtBanksConsole() {
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState<Page>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [bankName, setBankName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load(nextQuery = query, nextFilter = filter) {
    setLoading(true);
    const active = nextFilter === "all" ? "" : `&active=${nextFilter === "active"}`;
    try {
      const res = await api<Page>(
        `/api/v1/admin/dmt-banks?q=${encodeURIComponent(nextQuery)}&limit=100${active}`,
        { token },
      );
      setPage({ items: Array.isArray(res.items) ? res.items : [], total: res.total ?? 0 });
    } catch (err) {
      flash.fail(err, "Could not load the DMT bank list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load("", "all");
  }, [token]);

  async function syncFromInstantPay() {
    setSyncing(true);
    flash.clear();
    try {
      const res = await api<{ synced: number; inserted: number; updated: number; total: number }>(
        "/api/v1/admin/dmt-banks/sync",
        { token, method: "POST", body: "{}" },
      );
      await load();
      flash.ok(
        `Synced ${res.synced} banks from InstantPay (${res.inserted} new, ${res.updated} updated). Admin active/inactive overrides were preserved.`,
      );
    } catch (err) {
      flash.fail(err, formatApiError(err, "Could not sync DMT banks from InstantPay"));
    } finally {
      setSyncing(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/v1/admin/dmt-banks", {
        token,
        method: "POST",
        body: JSON.stringify({ bankId: bankId.trim(), bankName: bankName.trim() }),
      });
      setOpen(false);
      setBankId("");
      setBankName("");
      await load();
      flash.ok("Bank added. It is active.");
    } catch (err) {
      flash.fail(err, "Could not add the bank");
    }
  }

  async function toggle(bank: DmtBank) {
    try {
      await api(`/api/v1/admin/dmt-banks/${bank.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ active: !bank.active }),
      });
      await load();
      flash.ok(`${bank.bank_name} is now ${bank.active ? "inactive" : "active"}.`);
    } catch (err) {
      flash.fail(err, "Could not update the bank");
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await apiForm<{ inserted: number; updated: number; skipped: number }>(
        "/api/v1/admin/dmt-banks/upload",
        form,
        { token },
      );
      await load();
      flash.ok(
        `Uploaded ${result.inserted} new, updated ${result.updated}, skipped ${result.skipped}. New banks are active.`,
      );
    } catch (err) {
      flash.fail(err, formatApiError(err, "Could not upload the bank list"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Flash message={flash.message} error={flash.error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-950">DMT banks</h2>
          <p className="text-sm text-slate-500">
            {page.total} banks. Sync live IMPS/NEFT status &amp; global IFSCs from InstantPay or toggle individual banks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={syncFromInstantPay}
            className="btn-secondary inline-flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync from InstantPay"}
          </button>
          <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 text-xs">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload spreadsheet"}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) upload(file);
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2 text-xs"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add bank
          </button>
        </div>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          className="field flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by bank id, name, or IFSC alias"
        />
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["all", "active", "inactive"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${
                filter === item ? "bg-navy-950 text-white" : "text-slate-600"
              }`}
              onClick={() => {
                setFilter(item);
                load(query, item);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </form>
      {loading ? (
        <div className="card h-40 animate-pulse bg-slate-100" />
      ) : page.items.length === 0 ? (
        <EmptyState
          title="No banks yet"
          body="Click Sync from InstantPay to pull live DMT v2 banks, upload a spreadsheet, or add a bank manually."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Bank ID</th>
                <th className="px-4 py-3">Bank Name</th>
                <th className="px-4 py-3">Global IFSC</th>
                <th className="px-4 py-3">Rails</th>
                <th className="px-4 py-3">Last Synced</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {page.items.map((bank) => (
                <tr key={bank.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{bank.bank_id}</td>
                  <td className="px-4 py-3 font-medium text-navy-950">
                    {bank.bank_name}
                    {bank.ifsc_alias && (
                      <span className="ml-2 font-mono text-[11px] text-slate-400">({bank.ifsc_alias})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {bank.ifsc_global || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {bank.imps_enabled !== false && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          IMPS
                        </span>
                      )}
                      {bank.neft_enabled !== false && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          NEFT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {bank.last_synced_at || bank.synced_at ? when((bank.last_synced_at || bank.synced_at)!) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={bank.active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-bold text-navy-950 underline"
                      onClick={() => toggle(bank)}
                    >
                      {bank.active ? "Inactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormModal
        open={open}
        title="Add a DMT bank"
        description="New banks are active and can be chosen on the retailer DMT desk."
        onClose={() => setOpen(false)}
        onSubmit={create}
        submitLabel="Add bank"
      >
        <TextField label="Bank id" required value={bankId} onChange={setBankId} />
        <TextField label="Bank name" required value={bankName} onChange={setBankName} />
      </FormModal>
    </div>
  );
}
