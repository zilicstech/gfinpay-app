export type PlatformServiceRow = {
  code: string;
  name: string;
  description?: string;
  enabled?: boolean;
  sort_order?: number;
};

export type FdProviderRow = {
  code: string;
  name: string;
  fallback_rank?: number;
};

export type NavItem = { href: string; label: string };

export type ServiceAccess = {
  personal: boolean;
  business: boolean;
  identity?: boolean;
  bank?: boolean;
};

const ALWAYS: NavItem[] = [
  { href: "/agent/dashboard", label: "Home" },
  { href: "/agent/loans", label: "Loans" },
  { href: "/agent/wallet", label: "Wallet" },
  { href: "/agent/transactions", label: "Transactions" },
  { href: "/agent/customers", label: "Customers" },
  { href: "/agent/catalog", label: "Catalog" },
  { href: "/agent/reports", label: "Reports" },
];

export function serviceAccessFromVerification(verification: {
  identityStatus?: string;
  personalStatus?: string;
  bankVerificationStatus?: string;
  businessStatus?: string;
  agreementStatus?: string;
  servicesUnlocked?: boolean;
} | null | undefined): ServiceAccess {
  const identityOk =
    verification?.identityStatus === "VERIFIED" ||
    verification?.personalStatus === "PERSONAL_VERIFIED";
  const businessAndAgreementOk =
    verification?.servicesUnlocked === true ||
    (verification?.businessStatus === "BUSINESS_VERIFIED" &&
      verification?.agreementStatus === "SIGNED");
  return {
    personal: identityOk,
    identity: identityOk,
    bank: verification?.bankVerificationStatus === "VERIFIED",
    business: businessAndAgreementOk,
  };
}

export function canUseService(code: string, codes: Set<string>, access: ServiceAccess): boolean {
  const identityOk = Boolean(access.identity ?? access.personal);
  const fullServiceOk = Boolean(access.business && (access.bank ?? true));
  if (code === "LOANS") return true;
  if (code === "UPI_CASHOUT") return codes.has("UPI_CASHOUT") && fullServiceOk;
  if (code === "AEPS") return codes.has("AEPS") && fullServiceOk;
  if (code === "PAYOUT" || code === "DMT") return codes.has(code) && fullServiceOk;
  if (code === "BBPS" || code === "HOSPI_CASH") return codes.has(code) && identityOk;
  return codes.has(code) && identityOk;
}

export function enabledCodes(services: PlatformServiceRow[]): Set<string> {
  return new Set(services.filter((s) => s.enabled !== false).map((s) => s.code));
}

export function fdCardsEnabled(fdProviders: FdProviderRow[]): boolean {
  return fdProviders.length > 0;
}

export const LEAD_SERVICE_CODES = ["CREDIT_CARD", "INSTANT_LOAN", "PERSONAL_LOAN", "BUSINESS_LOAN", "SAVINGS"] as const;

export function leadGenEnabled(codes: Set<string>): boolean {
  return codes.has("LEAD_GEN") || LEAD_SERVICE_CODES.some((code) => codes.has(code));
}

export function customerDeskEnabled(codes: Set<string>, fdProviders: FdProviderRow[]): boolean {
  return leadGenEnabled(codes) || fdCardsEnabled(fdProviders) || codes.has("HOSPI_CASH");
}

export function buildAgentNav(
  codes: Set<string>,
  fdProviders: FdProviderRow[],
  access: ServiceAccess = { personal: false, business: false, identity: false, bank: false },
): NavItem[] {
  const identityOk = Boolean(access.identity ?? access.personal);
  const fullServiceOk = Boolean(access.business && (access.bank ?? true));
  const cashAndPayoutOk = fullServiceOk;
  const nav: NavItem[] = [
    { href: "/agent/dashboard", label: "Home" },
    { href: "/agent/loans", label: "Loans" },
  ];
  if (codes.has("DMT") && fullServiceOk) nav.push({ href: "/agent/dmt", label: "DMT" });
  if (codes.has("BBPS") && identityOk) nav.push({ href: "/agent/bbps", label: "Bills" });
  if (codes.has("UPI_CASHOUT") && cashAndPayoutOk) {
    nav.push({ href: "/agent/cash", label: "UPI Cashpoint" });
  }
  if (codes.has("AEPS") && cashAndPayoutOk) {
    nav.push({ href: "/agent/aeps", label: "AePS" });
  }
  if (codes.has("PAYOUT") && cashAndPayoutOk) nav.push({ href: "/agent/payout", label: "Payout" });
  nav.push({ href: "/agent/wallet", label: "Wallet" });
  nav.push({ href: "/agent/transactions", label: "Transactions" });
  nav.push({ href: "/agent/customers", label: "Customers" });
  nav.push({ href: "/agent/catalog", label: "Catalog" });
  if (customerDeskEnabled(codes, fdProviders) && identityOk) {
    nav.push({ href: "/agent/sales", label: "Sales" });
  }
  if (codes.has("HOSPI_CASH") && identityOk) nav.push({ href: "/agent/hospi-cash", label: "Hospi Cash" });
  nav.push({ href: "/agent/reports", label: "Reports" });
  return nav;
}

export function buildAgentMobileNav(
  codes: Set<string>,
  fdProviders: FdProviderRow[],
  access: ServiceAccess = { personal: false, business: false, identity: false, bank: false },
): NavItem[] {
  const identityOk = Boolean(access.identity ?? access.personal);
  const fullServiceOk = Boolean(access.business && (access.bank ?? true));
  const nav: NavItem[] = [{ href: "/agent/dashboard", label: "Home" }];
  if (codes.has("DMT") && fullServiceOk) nav.push({ href: "/agent/dmt", label: "Send" });
  if (codes.has("BBPS") && identityOk) nav.push({ href: "/agent/bbps", label: "Bills" });
  nav.push({ href: "/agent/wallet", label: "Wallet" });
  nav.push({ href: "/agent/more", label: "More" });
  return nav;
}

export type QuickTile = {
  code: string;
  href: string;
  label: string;
  hint: string;
  needsFd?: boolean;
  needsLeadGen?: boolean;
};

export const QUICK_TILES: QuickTile[] = [
  { code: "LOANS", href: "/agent/loans", label: "Loans", hint: "Up to ₹1,00,000 working capital" },
  { code: "DMT", href: "/agent/dmt", label: "Send money", hint: "Instant IMPS / NEFT" },
  { code: "BBPS", href: "/agent/bbps", label: "Pay a bill", hint: "Electricity, Fastag, DTH" },
  { code: "UPI_CASHOUT", href: "/agent/cash", label: "UPI Cashpoint", hint: "Dynamic QR cash-out" },
  { code: "AEPS", href: "/agent/aeps", label: "AePS", hint: "Aadhaar cash & balance" },
  { code: "PAYOUT", href: "/agent/payout", label: "Payout", hint: "Send to a bank account" },
  { code: "HOSPI_CASH", href: "/agent/hospi-cash", label: "Hospi Cash", hint: "Hospital cash card" },
];

export function filterQuickTiles(
  codes: Set<string>,
  _fdProviders: FdProviderRow[],
  access: ServiceAccess = { personal: false, business: false, identity: false, bank: false },
): QuickTile[] {
  const identityOk = Boolean(access.identity ?? access.personal);
  const fullServiceOk = Boolean(access.business && (access.bank ?? true));
  const cashAndPayoutOk = fullServiceOk;
  return QUICK_TILES.filter((t) => {
    if (t.code === "LOANS") return true;
    if (t.code === "UPI_CASHOUT") return codes.has("UPI_CASHOUT") && cashAndPayoutOk;
    if (t.code === "AEPS") return codes.has("AEPS") && cashAndPayoutOk;
    if (t.code === "PAYOUT") return codes.has("PAYOUT") && cashAndPayoutOk;
    if (!codes.has(t.code)) return false;
    if (t.code === "BBPS" || t.code === "HOSPI_CASH") return identityOk;
    return fullServiceOk;
  });
}

export function buildMoreItems(
  codes: Set<string>,
  fdProviders: FdProviderRow[],
  access: ServiceAccess = { personal: false, business: false, identity: false, bank: false },
) {
  const identityOk = Boolean(access.identity ?? access.personal);
  const fullServiceOk = Boolean(access.business && (access.bank ?? true));
  const cashAndPayoutOk = fullServiceOk;
  const items: { href: string; label: string; hint: string }[] = [
    { href: "/agent/loans", label: "Loans", hint: "Microfinance & working capital loans up to ₹1,00,000" },
  ];
  if (codes.has("BBPS") && identityOk) items.push({ href: "/agent/bbps", label: "Bill pay", hint: "Fetch and pay BBPS bills" });
  if (codes.has("UPI_CASHOUT") && cashAndPayoutOk) {
    items.push({ href: "/agent/cash", label: "UPI Cashpoint", hint: "Accept dynamic UPI QR cash-outs" });
  }
  if (codes.has("AEPS") && cashAndPayoutOk) {
    items.push({ href: "/agent/aeps", label: "AePS", hint: "Aadhaar cash withdrawal, balance & mini statement" });
  }
  if (codes.has("PAYOUT") && cashAndPayoutOk) items.push({ href: "/agent/payout", label: "Payout", hint: "Send to a bank account" });
  items.push(
    { href: "/agent/customers", label: "Customers", hint: "People you added and their history" },
    { href: "/agent/catalog", label: "Catalog", hint: "Services you can sell" },
  );
  if (customerDeskEnabled(codes, fdProviders) && identityOk) {
    items.push({ href: "/agent/sales", label: "Sales", hint: "Links you have shared" });
  }
  if (codes.has("HOSPI_CASH") && identityOk) {
    items.push({ href: "/agent/hospi-cash", label: "Hospi Cash", hint: "Sell a hospital cash card" });
  }
  items.push(
    { href: "/agent/transactions", label: "Transactions", hint: "Receipts and history" },
    { href: "/agent/reports", label: "Reports", hint: "Your commission" },
    { href: "/agent/profile", label: "My profile", hint: "Identity, business, agreement, bank details, password, and PIN" },
  );
  return items;
}

export const FALLBACK_DISTRIBUTOR_NAV: NavItem[] = [
  { href: "/distributor/overview", label: "Overview" },
  { href: "/distributor/onboarding", label: "Onboarding" },
  { href: "/distributor/verification", label: "Verification" },
  { href: "/distributor/agents", label: "Retailers" },
  { href: "/distributor/inquiries", label: "Inquiries" },
  { href: "/distributor/customers", label: "Customers" },
  { href: "/distributor/catalog", label: "Catalog" },
  { href: "/distributor/transactions", label: "Transactions" },
  { href: "/distributor/earnings", label: "Earnings" },
  { href: "/distributor/profile", label: "My profile" },
];

export function buildDistributorNav(codes: Set<string>, fdProviders: FdProviderRow[]): NavItem[] {
  const nav: NavItem[] = [
    { href: "/distributor/overview", label: "Overview" },
    { href: "/distributor/onboarding", label: "Onboarding" },
    { href: "/distributor/verification", label: "Verification" },
    { href: "/distributor/agents", label: "Retailers" },
    { href: "/distributor/inquiries", label: "Inquiries" },
  ];
  nav.push(
    { href: "/distributor/customers", label: "Customers" },
    { href: "/distributor/catalog", label: "Catalog" },
  );
  if (customerDeskEnabled(codes, fdProviders)) {
    nav.push({ href: "/distributor/sales", label: "Sales" });
  }
  if (codes.has("HOSPI_CASH")) nav.push({ href: "/distributor/hospi-cash", label: "Hospi Cash" });
  nav.push(
    { href: "/distributor/transactions", label: "Transactions" },
    { href: "/distributor/earnings", label: "Earnings" },
    { href: "/distributor/profile", label: "My profile" },
  );
  return nav;
}

/** Nav shown while platform services are loading. */
export const FALLBACK_AGENT_NAV = ALWAYS;
