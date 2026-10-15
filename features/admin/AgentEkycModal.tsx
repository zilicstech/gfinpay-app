"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal, Alert } from "@/components/ui/primitives";
import { api, formatApiError } from "@/lib/api-client";
import { LinkShare } from "@/features/sales/LinkShare";

type OnboardLink = {
  kyc_status?: string;
  redirect_url?: string | null;
  message?: string;
};

export function AgentEkycModal({
  open,
  userId,
  userName,
  userType,
  email,
  token,
  scope = "admin",
  onClose,
  onVerified,
}: {
  open: boolean;
  userId?: string;
  userName?: string;
  userType?: string;
  email?: string | null;
  mobile?: string;
  token?: string | null;
  scope?: "admin" | "desk";
  onClose: () => void;
  onVerified?: () => void;
}) {
  const retailer = !userType || userType === "RETAILER";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<OnboardLink | null>(null);
  const [draftEmail, setDraftEmail] = useState("");
  const needsEmail = !email?.trim();
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    if (!open) {
      setDraftEmail("");
      setError(null);
      setLink(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !retailer || !userId || !token || needsEmail) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLink(null);
    const path = scope === "desk"
      ? `/api/v1/desk/outlets/${userId}/paysprint-onboard`
      : `/api/v1/admin/users/${userId}/paysprint-onboard`;
    api<OnboardLink>(path, { token, method: "POST", body: JSON.stringify({}) })
      .then((row) => {
        if (cancelled) return;
        setLink(row);
        if ((row.kyc_status ?? "").toUpperCase() === "COMPLETED" || (row.kyc_status ?? "").toUpperCase() === "VERIFIED") onVerifiedRef.current?.();
      })
      .catch((e) => {
        if (!cancelled) setError(formatApiError(e, "Could not start eKYC"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, retailer, userId, token, scope, needsEmail]);

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (!userId || !token) return;
    setLoading(true);
    setError(null);
    const path = scope === "desk"
      ? `/api/v1/desk/outlets/${userId}/paysprint-onboard`
      : `/api/v1/admin/users/${userId}/paysprint-onboard`;
    try {
      const row = await api<OnboardLink>(path, {
        token,
        method: "POST",
        body: JSON.stringify({ email: draftEmail.trim() }),
      });
      setLink(row);
      if ((row.kyc_status ?? "").toUpperCase() === "COMPLETED" || (row.kyc_status ?? "").toUpperCase() === "VERIFIED") onVerifiedRef.current?.();
    } catch (err) {
      setError(formatApiError(err, "Could not start eKYC"));
    } finally {
      setLoading(false);
    }
  }

  const url = link?.redirect_url ?? "";
  const verified = (link?.kyc_status ?? "").toUpperCase() === "COMPLETED"
    || (link?.kyc_status ?? "").toUpperCase() === "VERIFIED";

  return (
    <Modal open={open} title="Do eKYC" onClose={onClose}>
      {!retailer ? (
        <p className="text-sm text-navy-600">
          PaySprint eKYC is started from a retailer profile. Open the retailer and use Do eKYC there.
        </p>
      ) : needsEmail && !url ? (
        <form className="space-y-3" onSubmit={submitEmail}>
          <p className="text-sm text-navy-600">
            PaySprint requires an email for this retailer before it will create the eKYC link.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <label className="block text-sm font-medium text-navy-800">
            Email
            <input
              type="email"
              required
              className="field mt-1.5"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Starting…" : "Continue"}
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : verified ? (
        <p className="text-sm text-navy-600">eKYC is completed for {userName || "this retailer"}.</p>
      ) : url ? (
        <div className="space-y-3">
          <p className="text-sm text-navy-600">
            Share this Gfinpay link. It opens on Gfinpay first, then continues to PaySprint eKYC.
            The fingerprint is captured on PaySprint, on a computer with a UIDAI scanner.
          </p>
          <LinkShare
            url={url}
            caption={`Complete PaySprint eKYC${userName ? ` for ${userName}` : ""}.`}
            hint="Open this link. Gfinpay will continue to PaySprint."
          />
        </div>
      ) : (
        <p className="text-sm text-navy-600">{link?.message || "PaySprint did not return an onboarding link."}</p>
      )}
      <div className="mt-4 flex justify-end">
        <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

export function agentKycStatus(user: { kyc?: { kyc_status?: string } | null; kyc_status?: string }) {
  return user.kyc?.kyc_status ?? user.kyc_status ?? "NOT_STARTED";
}

export function agentEkycVerified(user: { kyc?: { kyc_status?: string } | null; kyc_status?: string }) {
  const status = agentKycStatus(user).toUpperCase();
  return status === "COMPLETED" || status === "VERIFIED";
}

export function agentEkycLinkOpened(user: { kyc?: { paysprint_onboard_issued_at?: string | null } | null }) {
  return Boolean(user.kyc?.paysprint_onboard_issued_at);
}

type OnboardStatus = {
  kyc_status?: string;
  is_approved?: string;
  message?: string;
  completed?: boolean;
  redirect_url?: string | null;
};

function statusHeading(approved: string) {
  switch (approved.trim().toLowerCase()) {
    case "accepted":
      return "eKYC completed";
    case "rejected":
      return "Rejected by the bank";
    case "pending":
      return "eKYC pending";
    case "verification-pending":
      return "Verification pending";
    case "in-process":
      return "Waiting for the bank";
    case "not-onboarded":
      return "Not onboarded";
    default:
      return approved.trim() || "Status unavailable";
  }
}

export function AgentEkycStatusModal({
  open,
  userId,
  userName,
  token,
  scope = "admin",
  onClose,
  onVerified,
}: {
  open: boolean;
  userId?: string;
  userName?: string;
  token?: string | null;
  scope?: "admin" | "desk";
  onClose: () => void;
  onVerified?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [status, setStatus] = useState<OnboardStatus | null>(null);
  const [freshLink, setFreshLink] = useState<OnboardLink | null>(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    if (!open) {
      setError(null);
      setRefreshError(null);
      setStatus(null);
      setFreshLink(null);
      setRefreshing(false);
      return;
    }
    if (!userId || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStatus(null);
    const path = scope === "desk"
      ? `/api/v1/desk/outlets/${userId}/paysprint-onboard/status`
      : `/api/v1/admin/users/${userId}/paysprint-onboard/status`;
    api<OnboardStatus>(path, { token, method: "POST", body: JSON.stringify({}) })
      .then((row) => {
        if (cancelled) return;
        setStatus(row);
        if (row.completed || (row.kyc_status ?? "").toUpperCase() === "COMPLETED" || (row.kyc_status ?? "").toUpperCase() === "VERIFIED") onVerifiedRef.current?.();
      })
      .catch((e) => {
        if (!cancelled) setError(formatApiError(e, "Could not check eKYC status"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId, token, scope]);

  async function generateNewLink() {
    if (!userId || !token || refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    const path = scope === "desk"
      ? `/api/v1/desk/outlets/${userId}/paysprint-onboard/refresh`
      : `/api/v1/admin/users/${userId}/paysprint-onboard/refresh`;
    try {
      const row = await api<OnboardLink>(path, { token, method: "POST", body: JSON.stringify({}) });
      setFreshLink(row);
      if ((row.kyc_status ?? "").toUpperCase() === "COMPLETED" || (row.kyc_status ?? "").toUpperCase() === "VERIFIED") onVerifiedRef.current?.();
    } catch (err) {
      setRefreshError(formatApiError(err, "Could not generate a new onboarding link"));
    } finally {
      setRefreshing(false);
    }
  }

  const approved = status?.is_approved ?? "";
  const completed = Boolean(status?.completed)
    || approved.trim().toLowerCase() === "accepted"
    || (freshLink?.kyc_status ?? "").toUpperCase() === "COMPLETED"
    || (freshLink?.kyc_status ?? "").toUpperCase() === "VERIFIED";
  const tone = completed ? "success" : approved.trim().toLowerCase() === "rejected" ? "error" : "info";
  const shareUrl = freshLink?.redirect_url || status?.redirect_url || "";

  return (
    <Modal open={open} title="eKYC status" onClose={onClose} persistent>
      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <div className="space-y-3">
          {error && <Alert tone="error">{error}</Alert>}
          {status && (
            <>
              <p className="text-sm font-semibold text-navy-950">{statusHeading(approved)}</p>
              <Alert tone={tone}>
                {status.message || "PaySprint did not return an onboarding status."}
              </Alert>
              {userName && (
                <p className="text-sm text-navy-600">Status for {userName} on Bank 2.</p>
              )}
            </>
          )}
          {!completed && (
            <div className="space-y-3">
              <p className="text-sm text-navy-600">
                PaySprint onboarding pages expire. Generate a new link and share it again so the retailer can continue.
              </p>
              {refreshError && <Alert tone="error">{refreshError}</Alert>}
              {freshLink?.message && freshLink.redirect_url && (
                <Alert tone="success">{freshLink.message}</Alert>
              )}
              {shareUrl && (
                <LinkShare
                  url={shareUrl}
                  share={false}
                  caption={`Complete PaySprint eKYC${userName ? ` for ${userName}` : ""}.`}
                  hint={freshLink?.redirect_url
                    ? "This opens a new PaySprint session. The previous page has expired."
                    : "This is the same link already shared. Gfinpay continues to PaySprint."}
                />
              )}
              <div className="flex justify-end">
                <button type="button" className="btn-primary" onClick={generateNewLink} disabled={refreshing || !userId || !token}>
                  {refreshing ? "Generating…" : "New eKyc Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
