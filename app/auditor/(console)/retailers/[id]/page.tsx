"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, Clock, Copy, Phone, Users, Wallet } from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, useFlash } from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { RetailerRequestsPanel } from "@/features/finance/RetailerRequestsPanel";
import type { UserDetail } from "@/features/admin/types";

export default function AuditorRetailerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("CREDIT");
  const [narration, setNarration] = useState("");
  const [tab, setTab] = useState<"requests">("requests");
  const [requestCount, setRequestCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  async function load() {
    setUser(await api<UserDetail>(`/api/v1/auditor/retailers/${id}`, { token }));
  }

  useEffect(() => {
    if (token && id) load().catch((e) => setError(formatApiError(e, "Failed to load retailer")));
  }, [token, id]);

  async function adjust(e: FormEvent) {
    e.preventDefault();
    try {
      setUser(await api<UserDetail>(`/api/v1/auditor/retailers/${id}/wallet/adjust`, {
        token,
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), direction, narration }),
      }));
      setOpen(false);
      setAmount("");
      setNarration("");
      flash.ok("Wallet adjustment posted.");
    } catch (err) {
      flash.fail(err, "Adjustment failed");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function copyCode() {
    if (!user?.code) return;
    await navigator.clipboard.writeText(user.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!user) return <div className="card h-48 animate-pulse bg-slate-100" />;

  const manageActions: ManageAction[] = [
    {
      label: "Adjust wallet",
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => setOpen(true),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link href="/auditor/retailers" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950">
        ← Back to Retailers
      </Link>
      <Flash message={flash.message} error={flash.error} />

      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">Retailer outlet</span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">{user.full_name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                Distributor: <span className="font-medium text-slate-200">{user.parent_name || "Direct outlet"}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium text-slate-200">
                  {[user.hub_name, user.hub_code ? `(${user.hub_code})` : ""].filter(Boolean).join(" ") || "Unassigned hub"}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {user.code}
                  <button type="button" className="text-emerald-400/70 hover:text-emerald-300" onClick={copyCode} aria-label="Copy code">
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold">Copied</span>}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400" />
                {maskMobile(user.mobile)}
                <button type="button" className="text-slate-400 hover:text-white" onClick={copyMobile} aria-label="Copy mobile">
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied</span>}
              </span>
            </div>
            {user.created_at && (
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {when(user.created_at)}
              </p>
            )}
          </div>
          <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available balance</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-950">{inr(user.wallet?.availableBalance)}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On hold</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-950">{inr(user.wallet?.holdBalance)}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1 w-fit">
          <button type="button" className="rounded-xl bg-navy-950 px-4 py-2 text-xs font-bold text-white shadow-xs" onClick={() => setTab("requests")}>
            Requests{tab === "requests" ? ` (${requestCount})` : ""}
          </button>
        </div>
        {id && (
          <RetailerRequestsPanel token={token} retailerId={id} onCount={setRequestCount} />
        )}
      </section>

      <FormModal
        open={open}
        title="Adjust wallet"
        description="Posts an adjustment to the ledger."
        onClose={() => setOpen(false)}
        onSubmit={adjust}
        submitLabel="Post adjustment"
      >
        <SelectField
          label="Direction"
          required
          value={direction}
          onChange={setDirection}
          options={[
            { value: "CREDIT", label: "Credit" },
            { value: "DEBIT", label: "Debit" },
          ]}
        />
        <TextField label="Amount" required inputMode="numeric" value={amount} onChange={setAmount} />
        <TextField label="Narration" value={narration} onChange={setNarration} />
      </FormModal>
    </div>
  );
}
