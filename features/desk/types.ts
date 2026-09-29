import type { ServiceTotal, TrendPoint } from "@/features/admin/TrendCharts";
import type { TxnRow, UserRow } from "@/features/admin/types";

export type OutletRow = UserRow & {
  gmv_month?: number;
  txn_success?: number;
  customer_count?: number;
  available_balance?: number;
  hold_balance?: number;
  wallet_status?: string;
};

export type DeskOverview = {
  scope: "NETWORK" | "OUTLET";
  gmvToday: number;
  gmvMonth: number;
  gmvAll: number;
  txnToday: number;
  txnMonth: number;
  successCountMonth: number;
  failedCountMonth: number;
  successRateMonth: number;
  feeMonth: number;
  commissionEarned: number;
  commissionMonth: number;
  outletCount?: number;
  activeOutlets?: number;
  pendingKyc?: number;
  walletFloat: number;
  walletAvailable?: number;
  walletHold?: number;
  walletStatus?: string;
  customerCount: number;
  topRetailers?: { id: string; full_name: string; shop_name?: string; txn_count: number; volume: number; gmv_month: number }[];
  attention?: { id: string; full_name: string; status: string; kyc_status?: string; wallet_status?: string; reason: string }[];
  gmvByDay: { day: string; gmv: number; txn_count: number }[];
  transactionsByState?: { txn_type: string; state: string; count: number; amount: number }[];
  serviceTotals?: ServiceTotal[];
  trends?: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  recentTransactions: TxnRow[];
};

export type OutletPerformance = {
  outletId: string;
  gmvToday: number;
  gmvMonth: number;
  gmvAll: number;
  successCountMonth: number;
  failedCountMonth: number;
  successRateMonth: number;
  txnMonth: number;
  customerCount: number;
  commissionEarned: number;
  gmvByDay: { day: string; gmv: number; txn_count: number }[];
};

export type DeskCustomer = {
  id: string;
  mobile: string;
  full_name: string;
  kyc_level: string;
  ovd_type?: string;
  ovd_last4?: string;
  mobile_verified_at?: string;
  created_at?: string;
  outlet_id?: string;
  outlet_name?: string;
  shop_name?: string;
  remaining_monthly_limit?: number;
  txn_count?: number;
  volume?: number;
};

export type DeskCustomerDetail = DeskCustomer & {
  beneficiaries?: { id: string; name: string; account_last4: string; ifsc: string; verified_at?: string }[];
  recentTransactions?: TxnRow[];
};

export type DeskEarnings = {
  earned: number;
  earnedMonth: number;
  byRole: { role_in_split: string; amount: number }[];
  byOutlet?: { id: string; full_name: string; amount: number }[];
};
