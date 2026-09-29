"use client";

import { EkycComingSoonModal } from "@/features/ekyc/EkycComingSoonModal";

export function AgentEkycModal({
  open,
  onClose,
}: {
  open: boolean;
  userId?: string;
  userName?: string;
  mobile?: string;
  token?: string | null;
  onClose: () => void;
  onVerified?: () => void;
}) {
  return <EkycComingSoonModal open={open} title="Agent eKYC" onClose={onClose} />;
}

export function agentKycStatus(user: { kyc?: { kyc_status?: string } | null; kyc_status?: string }) {
  return user.kyc?.kyc_status ?? user.kyc_status ?? "NOT_STARTED";
}

export function agentEkycVerified(user: { kyc?: { kyc_status?: string } | null; kyc_status?: string }) {
  return agentKycStatus(user) === "VERIFIED";
}
