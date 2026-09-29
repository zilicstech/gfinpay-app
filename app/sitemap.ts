import { SITE } from "@/lib/site";

export default function sitemap() {
  const paths = [
    "",
    "/about",
    "/services",
    "/services/domestic-money-transfer",
    "/services/bbps",
    "/services/recharge",
    "/services/fastag",
    "/services/lic",
    "/services/aeps",
    "/services/upi-cash-out",
    "/services/agent-wallet",
    "/services/fd-credit-cards",
    "/services/bc-network",
    "/solutions",
    "/solutions/retailers",
    "/solutions/distributors",
    "/solutions/enterprises",
    "/compliance",
    "/contact",
    "/insights",
    "/insights/assisted-banking-india",
    "/legal/privacy",
    "/legal/terms",
    "/login",
  ];
  return paths.map((path) => ({
    url: `${SITE.url}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/services") ? 0.8 : 0.6,
  }));
}
