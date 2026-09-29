import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta("/solutions/distributors", "For distributors", "See retailers in your area, their business, and your commission.");

export default function Page() {
  return (
    <ServiceLayout
      kicker="Distributors"
      title="Look after the area, not the cash."
      art="network"
      lead="You earn a share when a retailer’s transfer succeeds. You do not take customer cash or FD money."
    >
      <p>See how much each retailer sent, your commission, and which retailers need KYC or a wallet top-up.</p>
    </ServiceLayout>
  );
}
