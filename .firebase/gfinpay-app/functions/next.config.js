"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// next.config.ts
var next_config_exports = {};
__export(next_config_exports, {
  default: () => next_config_default
});
module.exports = __toCommonJS(next_config_exports);
var nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
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
      { source: "/cards", destination: "/agent/customers", permanent: true }
    ];
  }
};
var next_config_default = nextConfig;
