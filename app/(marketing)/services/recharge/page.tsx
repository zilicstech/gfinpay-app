import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/recharge",
  "Mobile and DTH recharge",
  "Prepaid mobile and DTH recharge from a gfinpay retailer outlet — Airtel, Jio, Vi, BSNL, Tata Play, Dish TV.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Recharge"
      title="A number, a plan, and the wallet."
      art="recharge"
      lead="Pick the operator, enter the mobile or subscriber ID, choose a plan or type an amount. The retailer wallet pays first. The operator is credited after."
    >
      <p>Mobile: Airtel, Jio, Vi, BSNL. DTH: Tata Play, Airtel Digital TV, Dish TV, Sun Direct.</p>
      <p>There is no bill fetch on prepaid. You cannot recharge more than the wallet balance plus the small convenience fee.</p>
    </ServiceLayout>
  );
}
