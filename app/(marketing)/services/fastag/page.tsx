import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/fastag",
  "FASTag",
  "Recharge a vehicle FASTag from a gfinpay kirana retailer. Some banks show the outstanding first.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="FASTag"
      title="Vehicle number in. Tag balance up."
      art="fastag"
      lead="Enter the registration number. Axis and SBI can be paid directly. ICICI and HDFC ask you to fetch the outstanding first."
    >
      <p>The customer pays you in cash. You pay from the wallet. A receipt with the partner reference stays in transactions.</p>
    </ServiceLayout>
  );
}
