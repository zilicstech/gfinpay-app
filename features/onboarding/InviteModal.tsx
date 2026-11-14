"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Link2, Share2, X } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert } from "@/components/ui/primitives";
import type { Hub, UserRow } from "@/features/admin/types";

export type CreatedInvite = {
  id: string;
  role: string;
  full_name: string;
  mobile: string;
  email?: string | null;
  status: string;
  token: string;
  onboardingUrl: string;
};

export function InviteModal({
  open,
  role,
  distributors,
  hubs,
  defaultParentId,
  defaultHubId,
  onClose,
  onCreated,
}: {
  open: boolean;
  role: "RETAILER" | "MASTER_DISTRIBUTOR";
  distributors?: UserRow[];
  hubs?: Hub[];
  defaultParentId?: string;
  defaultHubId?: string;
  onClose: () => void;
  onCreated?: (invite: CreatedInvite) => void;
}) {
  const token = useSession((s) => s.token);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [parentId, setParentId] = useState(defaultParentId ?? "");
  const [hubId, setHubId] = useState(defaultHubId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedInvite | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName("");
      setMobile("");
      setEmail("");
      setParentId(defaultParentId || distributors?.[0]?.id || "");
      setHubId(defaultHubId || hubs?.[0]?.id || "");
      setError(null);
      setCreated(null);
      setCopied(false);
    }
  }, [open, defaultParentId, defaultHubId, distributors, hubs]);

  if (!open) return null;

  const roleLabel = role === "MASTER_DISTRIBUTOR" ? "Master Distributor" : "Retailer";
  const needsDistributorSelect = role === "RETAILER" && !defaultParentId && Array.isArray(distributors);
  const needsHubSelect = role === "MASTER_DISTRIBUTOR" && !defaultHubId && Array.isArray(hubs);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<CreatedInvite>("/api/v1/onboarding/invites", {
        token,
        method: "POST",
        body: JSON.stringify({
          role,
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          parentId: role === "RETAILER" ? (parentId || defaultParentId || undefined) : undefined,
          hubId: role === "MASTER_DISTRIBUTOR" ? (hubId || defaultHubId || undefined) : undefined,
        }),
      });
      setCreated(res);
      onCreated?.(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error.message : "Could not generate onboarding link");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!created) return;
    navigator.clipboard.writeText(created.onboardingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappHref = created
    ? `https://wa.me/91${created.mobile}?text=${encodeURIComponent(
        `Hi ${created.full_name}, complete your GFIN ${roleLabel} onboarding using this single-use verification link: ${created.onboardingUrl}`,
      )}`
    : "#";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-navy-950">
                {created ? `${roleLabel} Onboarding Link Ready` : `Generate ${roleLabel} Onboarding Link`}
              </h3>
              <p className="text-xs text-slate-500">
                {created
                  ? "Single-use self-service KYC & credential setup link (valid for 7 days)"
                  : "Partner will verify mobile OTP, Aadhaar DigiLocker, PAN, live selfie & set their PIN"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {!created ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {needsDistributorSelect && (
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Appoint Under Distributor *
                <select
                  className="field mt-1.5"
                  required
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  {distributors?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.code ?? d.mobile})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {needsHubSelect && (
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Assigned Hub Geography *
                <select
                  className="field mt-1.5"
                  required
                  value={hubId}
                  onChange={(e) => setHubId(e.target.value)}
                >
                  {hubs?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} · {h.city}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Full Name (as on Aadhaar / PAN) *
              <input
                className="field mt-1.5"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter partner full name"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              10-Digit Mobile Number *
              <input
                className="field mt-1.5 font-mono"
                inputMode="numeric"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
              />
              <span className="mt-1 block text-[11px] font-normal text-slate-400">
                The onboarding link is bound to this mobile number and verified via OTP.
              </span>
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Email Address (Optional)
              <input
                type="email"
                className="field mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || !fullName.trim() || mobile.length !== 10}
              >
                {busy ? "Generating Link…" : "Generate Onboarding Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 text-xs text-emerald-950 space-y-1">
                <p className="font-bold">
                  Invite sent to {created.full_name} (+91 {created.mobile})
                </p>
                <p className="text-emerald-800">
                  SMS dispatched and journey tracking started. Copy or share the link below.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Onboarding Link
              </span>
              <p className="font-mono text-xs text-navy-950 break-all select-all">
                {created.onboardingUrl}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="btn-primary inline-flex items-center gap-1.5 text-xs flex-1 justify-center"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <a
                href={created.onboardingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button type="button" className="btn-secondary text-xs" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

