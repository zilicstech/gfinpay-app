"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { when } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { EmptyState, StatusPill } from "@/components/ui/primitives";
import { Flash, useFlash } from "@/features/admin/AdminChrome";
import { InviteModal } from "@/features/onboarding/InviteModal";
import type { Hub, UserRow } from "@/features/admin/types";

export type InviteRow = {
  id: string;
  purpose: string;
  role: "RETAILER" | "MASTER_DISTRIBUTOR" | string;
  full_name: string;
  mobile: string;
  email?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
  parent_code?: string | null;
  hub_id?: string | null;
  hub_name?: string | null;
  hub_code?: string | null;
  user_id?: string | null;
  status: string;
  journey_id?: string | null;
  current_step?: string | null;
  journey_status?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  identity?: Record<string, unknown>;
  events?: {
    id: number;
    step: string;
    outcome: string;
    payload?: Record<string, unknown>;
    latitude?: number | string | null;
    longitude?: number | string | null;
    created_at?: string;
  }[];
};

const FUNNEL_STEPS = [
  { code: "LINK_SENT", label: "Link Sent" },
  { code: "LINK_OPENED", label: "Link Opened" },
  { code: "PHONE_VERIFIED", label: "OTP Verified" },
  { code: "LOCATION_CAPTURED", label: "GPS Captured" },
  { code: "AADHAAR_VERIFIED", label: "Aadhaar eKYC" },
  { code: "PAN_VERIFIED", label: "PAN Checked" },
  { code: "SELFIE_VERIFIED", label: "Selfie Passed" },
  { code: "CREDENTIALS_SET", label: "Completed" },
] as const;

function stepLabel(step?: string | null): string {
  return FUNNEL_STEPS.find((s) => s.code === step)?.label ?? step?.replaceAll("_", " ") ?? "Link Sent";
}

export function OnboardingFunnel({ scope }: { scope: "ADMIN" | "DISTRIBUTOR" }) {
  const token = useSession((s) => s.token);
  const flash = useFlash();

  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [distributors, setDistributors] = useState<UserRow[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stepFilter, setStepFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const [inviteRole, setInviteRole] = useState<"RETAILER" | "MASTER_DISTRIBUTOR" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InviteRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resentLink, setResentLink] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await api<InviteRow[]>("/api/v1/onboarding/invites", { token });
      setInvites(Array.isArray(rows) ? rows : []);
      if (scope === "ADMIN" && distributors.length === 0) {
        Promise.all([
          api<UserRow[]>("/api/v1/admin/users?type=MASTER_DISTRIBUTOR", { token }).catch(() => []),
          api<Hub[]>("/api/v1/admin/hubs", { token }).catch(() => []),
        ]).then(([d, h]) => {
          setDistributors(Array.isArray(d) ? d : []);
          setHubs(Array.isArray(h) ? h : []);
        });
      }
    } catch (e) {
      flash.fail(e, "Could not load onboarding funnel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetail(null);
    setResentLink(null);
    setReviewNote("");
    setDetailLoading(true);
    try {
      const d = await api<InviteRow>(`/api/v1/onboarding/invites/${id}`, { token });
      setDetail(d);
    } catch (e) {
      flash.fail(e, "Could not load invite details");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleResend(id: string) {
    setActionBusy(true);
    setResentLink(null);
    try {
      const res = await api<InviteRow & { onboardingUrl?: string }>(
        `/api/v1/onboarding/invites/${id}/resend`,
        { token, method: "POST", body: "{}" },
      );
      setDetail(res);
      if (res.onboardingUrl) setResentLink(res.onboardingUrl);
      flash.ok("Fresh onboarding link generated and sent via SMS.");
      refresh();
    } catch (e) {
      flash.fail(e, "Could not resend onboarding invite");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setActionBusy(true);
    try {
      const res = await api<InviteRow>(`/api/v1/onboarding/invites/${id}/revoke`, {
        token,
        method: "POST",
        body: "{}",
      });
      setDetail(res);
      flash.ok("Onboarding invite revoked.");
      refresh();
    } catch (e) {
      flash.fail(e, "Could not revoke invite");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReview(id: string, approve: boolean) {
    setActionBusy(true);
    try {
      const res = await api<InviteRow>(`/api/v1/onboarding/invites/${id}/review`, {
        token,
        method: "POST",
        body: JSON.stringify({ approve, note: reviewNote }),
      });
      setDetail(res);
      flash.ok(approve ? "Flagged step approved; partner can resume onboarding." : "Onboarding invite rejected.");
      refresh();
    } catch (e) {
      flash.fail(e, "Could not submit review decision");
    } finally {
      setActionBusy(false);
    }
  }

  const stepCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of FUNNEL_STEPS) map[s.code] = 0;
    for (const r of invites) {
      const st = r.current_step || "LINK_SENT";
      map[st] = (map[st] ?? 0) + 1;
    }
    return map;
  }, [invites]);

  const filtered = useMemo(() => {
    return invites.filter((r) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "NEEDS_REVIEW") {
          if (r.status !== "NEEDS_REVIEW" && r.journey_status !== "NEEDS_REVIEW") return false;
        } else if (statusFilter === "ABANDONED") {
          if (r.journey_status !== "ABANDONED") return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (stepFilter !== "ALL" && (r.current_step || "LINK_SENT") !== stepFilter) return false;
      if (roleFilter !== "ALL" && r.role !== roleFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          (r.parent_name && r.parent_name.toLowerCase().includes(q)) ||
          (r.hub_name && r.hub_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [invites, statusFilter, stepFilter, roleFilter, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Self-Service Onboarding
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
            Onboarding Funnel & Tracking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === "ADMIN"
              ? "Track every partner invite step-by-step, spot drop-offs, resend expired links, and review flagged KYC checks."
              : "Track retailer onboarding progress step-by-step, spot drop-offs, and resend expired links."}
          </p>
        </div>

        {scope === "ADMIN" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              onClick={() => setInviteRole("MASTER_DISTRIBUTOR")}
            >
              <Link2 className="h-3.5 w-3.5" />
              Invite Distributor
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-1.5 text-xs"
              onClick={() => setInviteRole("RETAILER")}
            >
              <Link2 className="h-3.5 w-3.5" />
              Invite Retailer
            </button>
          </div>
        )}
      </div>

      <Flash message={flash.message} error={flash.error} />

      {/* Step Funnel Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {FUNNEL_STEPS.map((s, idx) => {
          const active = stepFilter === s.code;
          const count = stepCounts[s.code] ?? 0;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setStepFilter(active ? "ALL" : s.code)}
              className={`rounded-2xl border p-3.5 text-left transition-all ${
                active
                  ? "border-navy-950 bg-navy-950 text-white shadow-md"
                  : "border-slate-200/90 bg-white hover:border-emerald-400"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${active ? "text-emerald-300" : "text-slate-400"}`}>
                Step {idx + 1}
              </span>
              <p className={`mt-0.5 text-xs font-bold truncate ${active ? "text-white" : "text-navy-950"}`}>
                {s.label}
              </p>
              <p className={`mt-2 font-display text-2xl font-extrabold ${active ? "text-emerald-400" : "text-navy-950"}`}>
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters & Table */}
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["ALL", "All"],
              ["SENT", "Link Sent"],
              ["IN_PROGRESS", "In Progress"],
              ["ABANDONED", "Drop-off (Abandoned)"],
              ["NEEDS_REVIEW", "Needs Review"],
              ["COMPLETED", "Completed"],
              ["EXPIRED", "Expired"],
              ["REVOKED", "Revoked"],
            ] as const).map(([key, label]) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive ? "bg-navy-950 text-white shadow-xs" : "text-slate-600 hover:text-navy-950"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {scope === "ADMIN" && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="field !py-2 text-xs w-40"
              >
                <option value="ALL">All Roles</option>
                <option value="RETAILER">Retailers</option>
                <option value="MASTER_DISTRIBUTOR">Distributors</option>
              </select>
            )}
            <div className="relative min-w-[16rem]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, mobile, hub..."
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
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No onboarding journeys found"
            body={
              scope === "ADMIN"
                ? "Generate an onboarding invite link for a retailer or distributor to track their verification journey here."
                : "Invite a retailer from the Retailers page to track their self-service onboarding progress here."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-4">Partner</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Network</th>
                  <th className="px-5 py-4">Current Step</th>
                  <th className="px-5 py-4">Journey Status</th>
                  <th className="px-5 py-4">Last Activity</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const jStatus = r.journey_status === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : r.journey_status === "ABANDONED" ? "ABANDONED" : r.status;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy-950">{r.full_name}</p>
                        <p className="font-mono text-xs text-slate-500">+91 {r.mobile}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {r.role === "MASTER_DISTRIBUTOR" ? "Distributor" : "Retailer"}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <p className="font-medium text-navy-950">{r.hub_name || "—"}</p>
                        {r.parent_name && <p className="text-[11px] text-slate-400">Under {r.parent_name}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-navy-950">
                          {stepLabel(r.current_step)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill value={jStatus} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {when(r.last_activity_at || r.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {r.user_id && (scope === "ADMIN" || r.role === "RETAILER") && (
                            <Link
                              href={
                                scope === "DISTRIBUTOR"
                                  ? `/distributor/agents/${r.user_id}`
                                  : r.role === "MASTER_DISTRIBUTOR"
                                    ? `/admin/distributors/${r.user_id}`
                                    : `/admin/retailers/${r.user_id}`
                              }
                              className="text-xs font-bold text-slate-600 hover:text-navy-950 px-2.5 py-1.5 rounded-xl bg-slate-100"
                            >
                              {scope === "DISTRIBUTOR" ? "Outlet" : "Profile"}
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => openDetail(r.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100"
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Creation Modal */}
      {scope === "ADMIN" && inviteRole && (
        <InviteModal
          open={true}
          role={inviteRole}
          distributors={distributors}
          hubs={hubs}
          onClose={() => setInviteRole(null)}
          onCreated={() => {
            flash.ok("Onboarding invite link created.");
            refresh();
          }}
        />
      )}

      {/* Journey Detail Drawer / Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Onboarding Journey Timeline
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-navy-950">
                  {detail ? `${detail.full_name} (+91 ${detail.mobile})` : "Loading…"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading || !detail ? (
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ) : (
              <div className="space-y-5">
                {/* Identity / Progress Summary Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Current Step</span>
                    <span className="font-bold text-navy-950 mt-0.5 block">{stepLabel(detail.current_step)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Invite Status</span>
                    <span className="font-bold text-navy-950 mt-0.5 block">{detail.status}</span>
                  </div>
                  {scope === "ADMIN" ? (
                    <>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Aadhaar Name</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">
                          {String(detail.identity?.aadhaarName || "—")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Masked Aadhaar</span>
                        <span className="font-mono font-bold text-navy-950 mt-0.5 block">
                          {detail.identity?.aadhaarLast4 ? `•••• ${String(detail.identity.aadhaarLast4)}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">PAN Last 4</span>
                        <span className="font-mono font-bold text-navy-950 mt-0.5 block">
                          {detail.identity?.panLast4 ? `••••••${String(detail.identity.panLast4)}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Match Scores</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">
                          Name: {String(detail.identity?.panNameMatchScore ?? "—")}% · Face: {String(detail.identity?.faceScore ?? "—")}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Hub</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">{detail.hub_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Sent On</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">{when(detail.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Expires On</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">{when(detail.expires_at)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[10px]">Last Activity</span>
                        <span className="font-bold text-navy-950 mt-0.5 block">{when(detail.last_activity_at || detail.created_at)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Resent Link Box */}
                {resentLink && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                    <p className="text-xs font-bold text-emerald-950">New Onboarding Link Generated:</p>
                    <p className="font-mono text-xs text-emerald-900 break-all">{resentLink}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(resentLink)}
                        className="btn-primary text-xs inline-flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>
                      <a
                        href={`https://wa.me/91${detail.mobile}?text=${encodeURIComponent(
                          `Complete your GFIN onboarding here: ${resentLink}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs inline-flex items-center gap-1"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
                      </a>
                      <a
                        href={resentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-xs inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                    </div>
                  </div>
                )}

                {/* Admin Manual Review Panel when NEEDS_REVIEW */}
                {scope === "ADMIN" &&
                  (detail.status === "NEEDS_REVIEW" || detail.journey_status === "NEEDS_REVIEW") && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Flagged for Manual KYC Review</span>
                      </div>
                      <input
                        className="field text-xs bg-white"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add review note (reason for approval or rejection)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleReview(detail.id, true)}
                          className="btn-primary text-xs"
                        >
                          Approve & Allow Resume
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleReview(detail.id, false)}
                          className="btn-secondary text-xs text-rose-600"
                        >
                          Reject & Revoke
                        </button>
                      </div>
                    </div>
                  )}

                {scope === "DISTRIBUTOR" &&
                  (detail.status === "NEEDS_REVIEW" || detail.journey_status === "NEEDS_REVIEW") && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Pending Platform Admin Review</p>
                        <p className="mt-0.5 text-amber-800">
                          This retailer&apos;s onboarding verification is awaiting compliance review and approval by Platform Admin.
                        </p>
                      </div>
                    </div>
                  )}

                {/* Append-only Event Log */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Event Audit Trail ({detail.events?.length ?? 0})
                  </h4>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200">
                    {(detail.events ?? []).map((ev) => (
                      <div key={ev.id} className="px-4 py-3 text-xs flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {ev.outcome === "SUCCESS" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : ev.outcome === "FAILURE" ? (
                              <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="font-bold text-navy-950">{ev.step}</span>
                            <span className="text-[10px] font-mono uppercase text-slate-500">({ev.outcome})</span>
                          </div>
                          {scope === "ADMIN" && ev.latitude != null && ev.longitude != null && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 pl-5">
                              <MapPin className="h-3 w-3 text-emerald-600" />
                              {String(ev.latitude)}, {String(ev.longitude)}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {when(ev.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {detail.status !== "COMPLETED" && detail.status !== "REVOKED" && (
                      <>
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleResend(detail.id)}
                          className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend Onboarding Link
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleRevoke(detail.id)}
                          className="btn-secondary text-xs text-rose-600"
                        >
                          Revoke Link
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setSelectedId(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

