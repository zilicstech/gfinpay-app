import type { FdCatalogItem, FdProvider } from "@/features/admin/types";

export function fdBanksLabel(items: FdCatalogItem[] | undefined): string {
  if (!items?.length) return "—";
  return items.map((i) => i.product_key).join(", ");
}

export function fdJourneyLabel(items: FdCatalogItem[] | undefined): string {
  const rail = items?.[0]?.rail ?? "";
  if (rail === "PAYSPRINT_FD") return "Dynamic (API)";
  if (rail === "ZET_LINK" || rail === "GROWMORE_LINK") return "Static link";
  return rail || "—";
}

export function fdProviderStatus(provider: FdProvider): string {
  return provider.enabled ? "ACTIVE" : "INACTIVE";
}

export const FD_PROVIDER_BLURB: Record<string, string> = {
  ZET: "SBM & IOB secured cards via static onboarding links.",
  PAYSPRINT: "SBM card via Novu — URL generated at runtime.",
  GROWMORE: "DCB card via Novu — static link you configure.",
};
