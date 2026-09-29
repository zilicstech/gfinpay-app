import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/agent-wallet",
  "Retailer wallet",
  "Add money to your retailer wallet, then send. You cannot go below zero.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Wallet"
      title="Add money first. Then do business."
      art="wallet"
      lead="Top up by UPI or netbanking. You cannot send more than the balance. If a transfer is in progress, that amount is on hold. If it fails, it comes back."
    >
      <p>When a send succeeds, your commission is added the same time. This keeps the retailer from going into minus.</p>
    </ServiceLayout>
  );
}
