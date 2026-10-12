export type FinanceKind = "ACTIVATION" | "WALLET_TOPUP" | "EARNINGS_WITHDRAW";
export type FinanceStatus = "PENDING" | "RECEIVED" | "REJECTED";

export type FinanceRequest = {
  id: string;
  kind: FinanceKind;
  retailer_user_id: string;
  requested_by: string;
  amount: number;
  utr: string;
  proof_filename?: string;
  proof_content_type?: string;
  remarks?: string | null;
  status: FinanceStatus;
  auditor_user_id?: string | null;
  auditor_notes?: string | null;
  reviewed_at?: string | null;
  wallet_txn_id?: string | null;
  created_at?: string;
  updated_at?: string;
  retailer_name?: string;
  retailer_mobile?: string;
  retailer_code?: string;
  retailer_status?: string;
  distributor_name?: string;
  requested_by_name?: string;
  requested_by_type?: string;
  auditor_name?: string | null;
  transfer_mode?: string | null;
  collection_bank_name?: string | null;
  collection_account_name?: string | null;
  collection_account_number?: string | null;
  collection_ifsc?: string | null;
  collection_upi?: string | null;
  payout_bank_name?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_ifsc?: string | null;
};

export function formatTransferMode(mode?: string | null) {
  if (!mode) return "—";
  if (mode === "QR") return "QR code";
  return mode;
}

export function formatFinanceKind(kind?: string) {
  if (kind === "WALLET_TOPUP") return "Wallet top-up";
  if (kind === "EARNINGS_WITHDRAW") return "Earnings withdrawal";
  if (kind === "ACTIVATION") return "Activation";
  return kind || "Request";
}

export function formatFinanceStatus(kind?: string | null, status?: string | null) {
  if (kind === "EARNINGS_WITHDRAW" && status === "RECEIVED") return "Transferred";
  if (status === "RECEIVED") return "Approved";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return status || "—";
}

/** Pill tone. A completed withdrawal is a success, even though it is stored as received. */
export function financeStatusTone(kind?: string | null, status?: string | null) {
  if (kind === "EARNINGS_WITHDRAW" && status === "RECEIVED") return "SUCCESS";
  return status || "UNKNOWN";
}

export type ActivationSummary = {
  canActivate?: boolean;
  latest?: FinanceRequest | null;
};
