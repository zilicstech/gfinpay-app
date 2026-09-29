import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/fd-credit-cards",
  "FD cards",
  "Help a customer take a card against a fixed deposit. They fund it from their own phone.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Cards"
      title="Help a regular take an FD card"
      art="cards"
      lead="You take name, mobile, ID and PAN, and get OTP consent. The customer puts money in a fixed deposit from their own bank account. You never collect that cash at the counter."
    >
      <p>After e-KYC, send them the payment link. When the card partner confirms, the retailer earns a fee.</p>
    </ServiceLayout>
  );
}
