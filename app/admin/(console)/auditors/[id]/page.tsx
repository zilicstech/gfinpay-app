"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CheckCircle2,
  Clock, 
  Copy, 
  FileCheck2, 
  History,
  KeyRound, 
  Lock, 
  Phone, 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  UserX,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, maskMobile, when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, FormModal, TextField, useFlash } from "@/features/admin/AdminChrome";
import { ManageMenu, type ManageAction } from "@/features/console/EntityChrome";
import { RequireSuperAdmin } from "@/features/admin/RequireSuperAdmin";
import { formatFinanceKind } from "@/features/finance/FinanceRequestCard";
import { formatFinanceStatus } from "@/features/finance/types";
import type { FinanceRequest } from "@/features/finance/types";
import type { UserDetail } from "@/features/admin/types";

type Modal = "password" | "inactivate" | "activate" | null;

export default function AuditorDetailPage() {
  return (
    <RequireSuperAdmin>
      <AuditorDetailInner />
    </RequireSuperAdmin>
  );
}

function AuditorDetailInner() {
  const { id } = useParams<{ id: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<"scope" | "history">("scope");
  const [history, setHistory] = useState<FinanceRequest[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    api<UserDetail>(`/api/v1/admin/users/${id}`, { token })
      .then(setUser)
      .catch((e) => setLoadError(formatApiError(e, "Failed to load auditor")));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id || tab !== "history") return;
    setHistory(null);
    setHistoryError(null);
    api<FinanceRequest[]>(`/api/v1/finance/requests?auditorId=${id}`, { token })
      .then((rows) => setHistory(Array.isArray(rows) ? rows : []))
      .catch((e) => setHistoryError(formatApiError(e, "Failed to load audit history")));
  }, [token, id, tab]);

  async function patchStatus(status: string) {
    try {
      setUser(
        await api<UserDetail>(`/api/v1/admin/users/${id}/status`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
      );
      setModal(null);
      flash.ok(`Auditor status is now ${status.toLowerCase()}.`);
    } catch (e) {
      flash.fail(e, "Could not update status");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/v1/admin/users/${id}/password`, {
        token,
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setModal(null);
      flash.ok("Password reset successfully. Share the new credentials out of band.");
    } catch (e) {
      flash.fail(e, "Could not reset password");
    }
  }

  async function copyMobile() {
    if (!user) return;
    await navigator.clipboard.writeText(user.mobile);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 1600);
  }

  async function copyCode() {
    if (!user?.code) return;
    await navigator.clipboard.writeText(user.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  }

  if (loadError) return <Alert tone="error">{loadError}</Alert>;

  if (!user) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-6 w-36 rounded-lg animate-pulse bg-slate-100" />
        <div className="h-48 rounded-[2.5rem] animate-pulse bg-slate-100" />
        <div className="h-64 rounded-3xl animate-pulse bg-slate-100" />
      </div>
    );
  }

  const manageActions: ManageAction[] = [
    {
      label: "Reset password",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => setModal("password"),
    },
    ...(user.status === "ACTIVE"
      ? [
          {
            label: "Inactivate",
            icon: <UserX className="h-4 w-4" />,
            onClick: () => setModal("inactivate"),
            tone: "danger" as const,
          },
        ]
      : [
          {
            label: "Restore access",
            icon: <ShieldCheck className="h-4 w-4" />,
            onClick: () => setModal("activate"),
          },
        ]),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/auditors"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-navy-950 transition-colors"
        >
          ← Back to Auditors
        </Link>
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Hero Card aligned with Distributors / Admins Detail */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-navy-950 p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wider text-xs uppercase">
                Finance Auditor
              </span>
              <span className="text-slate-600">·</span>
              <StatusPill value={user.status} />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                {user.full_name}
              </h1>
            </div>

            {/* Scope / Role Description */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Scale className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-200">Payment Verification &amp; Wallet Reconciliation</span>
            </div>

            {/* Row 1: GFINCODE & PHONE with copy */}
            <div className="flex flex-wrap items-center gap-2.5">
              {user.code && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <span>{user.code}</span>
                  <button
                    type="button"
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                    title="Copy GFIN Code"
                    onClick={copyCode}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {copiedCode && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{maskMobile(user.mobile)}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Mobile"
                  onClick={copyMobile}
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedMobile && <span className="text-[10px] text-emerald-400 font-bold ml-0.5">Copied!</span>}
              </span>
            </div>

            {/* Row 2: Time and User who created it */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Appointed {when(user.created_at)}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-white">
                    {user.created_by_name || user.created_by || "Platform Super Admin"}
                  </span>
                  {user.created_by_code && (
                    <span className="font-mono text-[10px] text-slate-400 ml-1">({user.created_by_code})</span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <ManageMenu actions={manageActions} variant="onDark" compactOnMobile />
          </div>
        </div>
      </section>

      {/* Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setTab("scope")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            tab === "scope"
              ? "bg-navy-950 text-white shadow-xs"
              : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Audit Scope &amp; Authority
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            tab === "history"
              ? "bg-navy-950 text-white shadow-xs"
              : "text-slate-600 hover:text-navy-950 hover:bg-slate-50"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Audit History
        </button>
      </div>

      {/* Tab Panels */}
      {tab === "scope" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Role Responsibilities */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-navy-950">
                Authorized Responsibilities
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Finance auditors sign in to the dedicated Finance Console (<code className="font-mono text-emerald-700">/auditor</code>) to perform oversight:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verify activation bank transfer proofs submitted by onboarding retailers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Approve or reject manual wallet credit requests after validating bank statement UTRs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Perform ledger corrections and post adjustment credits/debits directly to retailer float accounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Review end-of-day bank statement reconciliation batches and mark discrepancies.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Security & Policy Boundaries */}
          <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-navy-950">
                Policy &amp; Access Boundaries
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Operational guardrails strictly enforced by platform security:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Cannot alter system administrator roles, platform configurations, or vendor credentials.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Cannot onboard distributors or appoint administrative staff.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>All verification actions, proof downloads, and adjustments require mandatory rationale and are permanently logged in the audit trail.</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <AuditHistory rows={history} error={historyError} />
      )}

      {/* Reset Password Modal */}
      <FormModal
        open={modal === "password"}
        title="Reset Auditor Password"
        description="Provision a new password for this auditor. The password view icon allows you to verify credentials before saving."
        onClose={() => setModal(null)}
        onSubmit={resetPassword}
        submitLabel="Update Password"
        submitDisabled={!password || password.length < 8}
      >
        <TextField
          label="New Password"
          required
          type="password"
          value={password}
          onChange={setPassword}
        />
      </FormModal>

      {/* Suspend Modal */}
      <FormModal
        open={modal === "inactivate"}
        title="Suspend Auditor Account"
        description="This auditor will immediately lose access to the finance console."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          patchStatus("SUSPENDED");
        }}
        submitLabel="Suspend Access"
      >
        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
          Warning: Active sessions for this auditor will be terminated upon token expiration.
        </p>
      </FormModal>

      {/* Activate Modal */}
      <FormModal
        open={modal === "activate"}
        title="Restore Auditor Access"
        description="Return this auditor to active status with full finance console privileges."
        onClose={() => setModal(null)}
        onSubmit={(e) => {
          e.preventDefault();
          patchStatus("ACTIVE");
        }}
        submitLabel="Restore Access"
      >
        <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
          The auditor will once again be able to sign in and review proofs.
        </p>
      </FormModal>
    </div>
  );
}

function decisionLabel(kind: string | undefined, status: string) {
  return formatFinanceStatus(kind, status);
}

function AuditHistory({ rows, error }: { rows: FinanceRequest[] | null; error: string | null }) {
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!rows) {
    return <div className="h-48 rounded-[2.5rem] animate-pulse bg-slate-100" />;
  }

  const approved = rows.filter((row) => row.status === "RECEIVED").length;
  const rejected = rows.filter((row) => row.status === "REJECTED").length;

  return (
    <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-navy-950">Audit History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approvals and rejections this auditor has recorded on activation and wallet payments.
          </p>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          <span className="text-emerald-700">{approved} approved</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-rose-700">{rejected} rejected</span>
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No decisions yet"
          body="Approvals and rejections will appear here after this auditor reviews a payment."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Decision</th>
                <th className="px-5 py-3.5">Retailer</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">UTR</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5">Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <StatusPill
                      value={row.status === "RECEIVED" ? "VERIFIED" : "REJECTED"}
                      label={decisionLabel(row.kind, row.status)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-950">{row.retailer_name || "Retailer"}</p>
                    {row.retailer_code && (
                      <p className="font-mono text-[11px] text-slate-400">{row.retailer_code}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">{formatFinanceKind(row.kind)}</td>
                  <td className="px-5 py-4 font-mono text-xs font-bold text-navy-950">{inr(row.amount)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{row.utr}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-[16rem]">
                    {row.auditor_notes?.trim() || "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {row.reviewed_at ? when(row.reviewed_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
