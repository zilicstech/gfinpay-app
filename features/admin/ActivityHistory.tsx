"use client";

import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { inr, when } from "@/lib/format";
import { Alert, EmptyState, StatusPill } from "@/components/ui/primitives";

export type ActivityRow = {
  id: string;
  occurredAt: string;
  actorUserType?: string | null;
  actorCode?: string | null;
  action: string;
  subjectCode?: string | null;
  subjectName?: string | null;
  outcome: string;
  detail?: Record<string, unknown> | null;
};

export function kolkataToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const ROLES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HUBADMIN: "Hub Admin",
  MASTER_DISTRIBUTOR: "Distributor",
  RETAILER: "Retailer",
  AUDITOR: "Auditor",
};

const STATUSES: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  TERMINATED: "Closed",
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING_KYC: "KYC pending",
  PENDING_ACTIVATION: "Activation pending",
};

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  utr: "UTR",
  narration: "Note",
  remarks: "Note",
  notes: "Note",
  reason: "Reason",
  city: "City",
  state: "State",
  pincode: "PIN code",
  decision: "Decision",
  fullName: "Name",
  email: "Email",
};

const HIDDEN_FIELDS = new Set([
  "code", "name", "role", "status", "previousStatus", "currentStatus",
  "userType", "identifier", "multipart", "body", "password", "mobile",
  "direction", "frozen",
]);

function clean(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  return text === "null" ? "" : text;
}

function roleLabel(value?: string | null) {
  if (!value) return "";
  return ROLES[value] ?? value;
}

function statusWord(value: string) {
  if (!value) return "";
  return STATUSES[value.toUpperCase()] ?? value;
}

function person(name?: string | null, code?: string | null) {
  const who = clean(name);
  const gfin = clean(code);
  if (who && gfin) return `${who} (${gfin})`;
  return who || gfin;
}

function story(row: ActivityRow) {
  const detail = row.detail ?? {};
  const previous = statusWord(clean(detail.previousStatus));
  const current = statusWord(clean(detail.currentStatus) || clean(detail.status));
  if (previous && current) return `Changed from ${previous} to ${current}`;
  if (current && /status/i.test(row.action)) return `Changed to ${current}`;
  if (row.action === "User Login" && !row.actorCode) {
    const identifier = clean(detail.identifier);
    if (identifier) return `Sign-in attempt for ${identifier}`;
  }
  if (clean(detail.frozen) === "true") return "Wallet frozen";
  if (clean(detail.frozen) === "false") return "Wallet opened";
  return "";
}

function extras(detail?: Record<string, unknown> | null) {
  if (!detail) return "";
  const parts: string[] = [];
  const direction = clean(detail.direction).toUpperCase();
  if (direction === "CREDIT") parts.push("Added to wallet");
  if (direction === "DEBIT") parts.push("Taken from wallet");
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    if (HIDDEN_FIELDS.has(key)) continue;
    const value = clean(detail[key]);
    if (!value || (value.includes("-") && value.length > 30)) continue;
    parts.push(key === "amount" ? `${label}: ${inr(value)}` : `${label}: ${value}`);
  }
  return parts.join(" · ");
}

export function ActivityHistory({
  token,
  userId,
  title = "Audit history",
  body = "What happened on the selected day.",
}: {
  token?: string | null;
  userId?: string;
  title?: string;
  body?: string;
}) {
  const [date, setDate] = useState(kolkataToday);
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setRows(null);
    setError(null);
    const path = userId
      ? `/api/v1/admin/users/${userId}/activity?date=${date}`
      : `/api/v1/admin/activity?date=${date}`;
    api<ActivityRow[]>(path, { token })
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(formatApiError(e, "Could not load audit history"));
      });
    return () => {
      cancelled = true;
    };
  }, [token, userId, date]);

  return (
    <div className="space-y-4">
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-950">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{body}</p>
          </div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Date
            <input
              type="date"
              className="field mt-1.5"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {error ? (
          <Alert tone="error">{error}</Alert>
        ) : rows == null ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No activity" body="Nothing was recorded for this day." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Done by</th>
                  <th className="px-6 py-4">For</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const summary = story(row);
                  const more = extras(row.detail);
                  const who = person(row.subjectName, row.subjectCode) || person(clean(row.detail?.name), clean(row.detail?.code));
                  const ok = row.outcome === "SUCCESS";
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                        {when(row.occurredAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-navy-950">{row.action}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-navy-950">{row.actorCode || "—"}</p>
                        {roleLabel(row.actorUserType) && (
                          <p className="mt-0.5 text-[11px] text-slate-400">{roleLabel(row.actorUserType)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-navy-800">{who || "—"}</td>
                      <td className="px-6 py-4">
                        <p className="text-navy-800">{summary || "—"}</p>
                        {more && <p className="mt-0.5 text-xs text-slate-500">{more}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill value={ok ? "SUCCESS" : "FAILED"} label={ok ? "Successful" : "Failed"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
