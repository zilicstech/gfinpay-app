import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/bc-network",
  "Retailer network",
  "Admin appoints distributors. Distributors add retailers. No public signup.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Network"
      title="Admin, distributor, retailer"
      art="network"
      lead="Admin adds distributors. Distributors add retailers in their area. There is no public signup. Commission is shared when a transfer succeeds."
    >
      <p>You can see who can transact, who earns, and whose KYC is done. A retailer wallet starts after KYC is verified.</p>
    </ServiceLayout>
  );
}
