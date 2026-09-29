import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/upi-cash-out",
  "UPI to cash",
  "Show a QR. Customer pays from their UPI app. After paid, give them cash. Maximum ₹5,000.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Cash"
      title="UPI to cash"
      art="upi"
      lead="Show a QR on your phone. Customer pays from PhonePe, GPay or any UPI app and enters UPI PIN. Give cash only after it shows paid. Maximum ₹5,000."
    >
      <p>Write the customer’s name and mobile for your record. You do not do KYC again — their bank already has it. Never hand over notes before the collect is paid.</p>
    </ServiceLayout>
  );
}
