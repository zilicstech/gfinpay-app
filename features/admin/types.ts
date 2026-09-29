export type Hub = {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  status: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_by_code?: string;
  distributor_count?: number;
  admin_count?: number;
  distributors?: UserRow[];
  admins?: UserRow[];
};

export type UserRow = {
  id: string;
  user_type: string;
  full_name: string;
  code?: string;
  mobile: string;
  email?: string;
  status: string;
  parent_name?: string;
  parent_id?: string;
  hub_id?: string;
  hub_name?: string;
  hub_code?: string;
  shop_name?: string;
  retailer_city?: string;
  retailer_state?: string;
  retailer_pincode?: string;
  city?: string;
  state?: string;
  pincode?: string;
  kyc_status?: string;
  created_at?: string;
  created_by?: string;
  created_by_name?: string;
  created_by_code?: string;
};

export type DistributorDirectoryRow = UserRow & {
  assigned_here: boolean;
};

export type AdminDirectoryRow = UserRow & {
  hub_names: string;
  assigned_here: boolean;
};

export type WalletInfo = {
  walletId: string;
  availableBalance: number;
  holdBalance: number;
  status: string;
};

export type UserDetail = UserRow & {
  retailers?: UserRow[];
  wallet?: WalletInfo | null;
  recentTransactions?: TxnRow[];
  commissionEarned?: number;
  kyc?: {
    shop_name?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    kyc_status?: string;
    rejection_reason?: string;
    aadhaar_last4?: string;
  } | null;
};

export type TxnRow = {
  id: string;
  txn_type: string;
  state: string;
  amount: number;
  fee?: number;
  partner_ref?: string;
  failure_reason?: string;
  created_at?: string;
  agent_name?: string;
};

export type PlatformService = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type FdCatalogItem = {
  code: string;
  name: string;
  product_key: string;
  rail: string;
  apply_url?: string | null;
  active: boolean;
};

export type FdProvider = {
  code: string;
  name: string;
  enabled: boolean;
  novu: boolean;
  fallback_rank: number;
  commission_txn_type: string;
  catalog_items?: FdCatalogItem[];
  commission_rule?: {
    id?: string;
    commission_type?: string;
    flat_fee?: number;
    retailer_amount?: number;
    distributor_amount?: number;
    profit_per_card?: number;
    total_rate_bp?: number;
    slab_min?: number;
    slab_max?: number;
    retailer_share_pct?: number;
    distributor_share_pct?: number;
    platform_share_pct?: number;
  };
};

export type FdBudgetBand = {
  id: string;
  slab_min: number;
  slab_max: number;
  preferred_provider: string;
  preferred_provider_name?: string;
  preference_rank?: number;
};

export type FdCardSku = {
  code: string;
  name: string;
  product_key: string;
  provider: string;
  provider_name: string;
  provider_enabled: boolean;
  novu: boolean;
  rail: string;
  apply_url?: string | null;
  active: boolean;
  sort_order: number;
};

export type FdCommissionTier = {
  id: string;
  provider_code: string;
  provider_name?: string;
  cards_min: number;
  cards_max: number;
  fixed_amount_per_card: number;
  retailer_share_pct: number;
  distributor_share_pct: number;
  platform_share_pct: number;
};

export type FdProviderDesk = {
  code: string;
  name: string;
  fallback_rank?: number;
};

export type PlatformSetting = {
  key: string;
  value: string;
  label: string;
};
