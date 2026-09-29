import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/aeps",
  "Aadhaar cash",
  "Give cash from the retailer counter after the customer authenticates with Aadhaar thumb print.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Cash"
      title="Give cash with Aadhaar"
      art="aeps"
      lead="Customer puts thumb on the machine. Money comes from their bank. You give notes from the retailer counter. Your wallet is credited when the bank confirms."
    >
      <p>We keep only last 4 digits of Aadhaar, the bank code, and the receipt number. The fingerprint itself is never stored.</p>
    </ServiceLayout>
  );
}
