import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gfinpay.com" }],
        destination: "https://gfinpay.com/:path*",
        permanent: true,
      },
      { source: "/analytics", destination: "/admin/analytics", permanent: true },
      { source: "/distributors", destination: "/admin/distributors", permanent: true },
      { source: "/retailers", destination: "/admin/retailers", permanent: true },
      { source: "/commissions", destination: "/admin/analytics", permanent: true },
      { source: "/admin/commissions", destination: "/admin/analytics", permanent: true },
      { source: "/admin/commissions/:path*", destination: "/admin/analytics", permanent: true },
      { source: "/admin/catalog", destination: "/admin/analytics", permanent: true },
      { source: "/reports", destination: "/admin/reports", permanent: true },
      { source: "/onboarding", destination: "/admin/distributors", permanent: true },
      { source: "/users", destination: "/admin/retailers", permanent: true },
      { source: "/kyc", destination: "/admin/retailers", permanent: true },
      { source: "/admin/kyc", destination: "/admin/retailers", permanent: true },
      { source: "/admin/kyc/:id", destination: "/admin/retailers/:id", permanent: true },
      { source: "/agent/kyc", destination: "/agent/dashboard", permanent: false },
      { source: "/distributor/kyc", destination: "/distributor/overview", permanent: false },
      { source: "/distributor/kyc/:id", destination: "/distributor/agents/:id", permanent: false },
      { source: "/recon", destination: "/admin/recon", permanent: true },
      { source: "/settings", destination: "/admin/settings", permanent: true },
      { source: "/earnings", destination: "/distributor/overview", permanent: true },
      { source: "/agents", destination: "/distributor/agents", permanent: true },
      { source: "/dashboard", destination: "/agent/dashboard", permanent: true },
      { source: "/dmt", destination: "/agent/dmt", permanent: true },
      { source: "/wallet", destination: "/agent/wallet", permanent: true },
      { source: "/wallet/topup", destination: "/agent/wallet", permanent: true },
      { source: "/cash-out/upi", destination: "/agent/cash-out/upi", permanent: true },
      { source: "/cards", destination: "/agent/customers", permanent: true },
    ];
  },
};

export default nextConfig;
