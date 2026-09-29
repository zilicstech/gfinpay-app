import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/domestic-money-transfer",
  "Send money",
  "Take cash at the retailer counter and send it to any bank account in India. OTP and ID required. Limit ₹5,000 per send.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Send money"
      title="Cash at the counter. Money in their bank."
      art="dmt"
      lead="Customer gives you cash. You send it by IMPS or NEFT. You need their mobile, an official ID, and an OTP on every send. Maximum ₹5,000 at a time, ₹25,000 in a month."
    >
      <p>Register the customer, add the bank account, then send. Your wallet balance is held first. When the bank confirms, you get a receipt and your commission.</p>
      <p>Full Aadhaar is never stored — only last 4 digits of the ID.</p>
    </ServiceLayout>
  );
}
