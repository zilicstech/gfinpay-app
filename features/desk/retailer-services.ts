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

const ALWAYS: NavItem[] = [
  { href: "/agent/dashboard", label: "Home" },
  { href: "/agent/wallet", label: "Wallet" },
  { href: "/agent/transactions", label: "Transactions" },
  { href: "/agent/customers", label: "Customers" },
  { href: "/agent/catalog", label: "Catalog" },
  { href: "/agent/reports", label: "Reports" },
];

export function enabledCodes(services: PlatformServiceRow[]): Set<string> {
  return new Set(services.filter((s) => s.enabled !== false).map((s) => s.code));
}

export function fdCardsEnabled(fdProviders: FdProviderRow[]): boolean {
  return fdProviders.length > 0;
}

export function leadGenEnabled(codes: Set<string>): boolean {
  return codes.has("LEAD_GEN");
}

export function customerDeskEnabled(codes: Set<string>, fdProviders: FdProviderRow[]): boolean {
  return leadGenEnabled(codes) || fdCardsEnabled(fdProviders);
}

export function buildAgentNav(codes: Set<string>, fdProviders: FdProviderRow[]): NavItem[] {
  const nav: NavItem[] = [{ href: "/agent/dashboard", label: "Home" }];
  if (codes.has("DMT")) nav.push({ href: "/agent/dmt", label: "DMT" });
  if (codes.has("BBPS")) nav.push({ href: "/agent/bbps", label: "Bills" });
  if (codes.has("UPI_CASHOUT")) nav.push({ href: "/agent/cash-out/upi", label: "Cash" });
  if (codes.has("AEPS")) nav.push({ href: "/agent/aeps", label: "AePS" });
  nav.push({ href: "/agent/wallet", label: "Wallet" });
  nav.push({ href: "/agent/transactions", label: "Transactions" });
  nav.push({ href: "/agent/customers", label: "Customers" });
  nav.push({ href: "/agent/catalog", label: "Catalog" });
  if (customerDeskEnabled(codes, fdProviders)) {
    nav.push({ href: "/agent/sales", label: "Sales" });
  }
  nav.push({ href: "/agent/reports", label: "Reports" });
  return nav;
}

export function buildAgentMobileNav(codes: Set<string>, fdProviders: FdProviderRow[]): NavItem[] {
  const nav: NavItem[] = [{ href: "/agent/dashboard", label: "Home" }];
  if (codes.has("DMT")) nav.push({ href: "/agent/dmt", label: "Send" });
  if (codes.has("BBPS")) nav.push({ href: "/agent/bbps", label: "Bills" });
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
  { code: "DMT", href: "/agent/dmt", label: "Send money", hint: "Coming soon" },
  { code: "BBPS", href: "/agent/bbps", label: "Pay a bill", hint: "Coming soon" },
  { code: "UPI_CASHOUT", href: "/agent/cash-out/upi", label: "Give cash", hint: "Coming soon" },
  { code: "AEPS", href: "/agent/aeps", label: "AePS cash out", hint: "Coming soon" },
  { code: "LEAD_GEN", href: "/agent/catalog", label: "Sell a product", hint: "Leads & journeys", needsLeadGen: true },
  { code: "FD_MODULE", href: "/agent/customers", label: "FD cards", hint: "Secured card leads", needsFd: true },
];

export function filterQuickTiles(codes: Set<string>, fdProviders: FdProviderRow[]): QuickTile[] {
  const fd = fdCardsEnabled(fdProviders);
  const lead = leadGenEnabled(codes);
  const seen = new Set<string>();
  return QUICK_TILES.filter((t) => {
    if (t.needsFd && !fd) return false;
    if (t.needsLeadGen && !lead) return false;
    if (!t.needsFd && !t.needsLeadGen && !codes.has(t.code)) return false;
    if (t.code === "LEAD_GEN" || t.code === "FD_MODULE") {
      const key = t.href;
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}

export function buildMoreItems(codes: Set<string>, fdProviders: FdProviderRow[]) {
  const items: { href: string; label: string; hint: string }[] = [];
  if (codes.has("BBPS")) items.push({ href: "/agent/bbps", label: "Bill pay", hint: "Coming soon" });
  if (codes.has("UPI_CASHOUT")) items.push({ href: "/agent/cash-out/upi", label: "UPI to cash", hint: "Coming soon" });
  if (codes.has("AEPS")) items.push({ href: "/agent/aeps", label: "AePS cash out", hint: "Coming soon" });
  items.push(
    { href: "/agent/customers", label: "Customers", hint: "People you added and their history" },
    { href: "/agent/catalog", label: "Catalog", hint: "Services you can sell" },
  );
  if (customerDeskEnabled(codes, fdProviders)) {
    items.push({ href: "/agent/sales", label: "Sales", hint: "Links you have shared" });
  }
  items.push(
    { href: "/agent/transactions", label: "Transactions", hint: "Receipts and history" },
    { href: "/agent/reports", label: "Reports", hint: "Your commission" },
    { href: "/agent/profile", label: "My profile", hint: "Name, email, password" },
  );
  return items;
}

export const FALLBACK_DISTRIBUTOR_NAV: NavItem[] = [
  { href: "/distributor/overview", label: "Overview" },
  { href: "/distributor/agents", label: "Retailers" },
  { href: "/distributor/customers", label: "Customers" },
  { href: "/distributor/catalog", label: "Catalog" },
  { href: "/distributor/transactions", label: "Transactions" },
  { href: "/distributor/earnings", label: "Earnings" },
];

export function buildDistributorNav(codes: Set<string>, fdProviders: FdProviderRow[]): NavItem[] {
  const nav: NavItem[] = [
    { href: "/distributor/overview", label: "Overview" },
    { href: "/distributor/agents", label: "Retailers" },
  ];
  nav.push(
    { href: "/distributor/customers", label: "Customers" },
    { href: "/distributor/catalog", label: "Catalog" },
  );
  if (customerDeskEnabled(codes, fdProviders)) {
    nav.push({ href: "/distributor/sales", label: "Sales" });
  }
  nav.push(
    { href: "/distributor/transactions", label: "Transactions" },
    { href: "/distributor/earnings", label: "Earnings" },
  );
  return nav;
}

/** Nav shown while platform services are loading. */
export const FALLBACK_AGENT_NAV = ALWAYS;
