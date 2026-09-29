import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/lic",
  "LIC premium",
  "Collect a Life Insurance Corporation premium at a gfinpay retailer counter after fetching the amount due.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="LIC"
      title="Fetch the premium. Then pay it."
      art="lic"
      lead="Enter the policy number. The till shows the amount due. You take cash and pay from the retailer wallet — the same path as a BBPS bill."
    >
      <p>A fetch is required. Part-pay is not offered. Commission posts when the payment succeeds.</p>
    </ServiceLayout>
  );
}
