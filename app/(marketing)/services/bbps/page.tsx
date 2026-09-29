import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/bbps",
  "Bill pay",
  "Pay electricity, water, gas, broadband, LPG, credit card, loan, education, and municipal bills from a gfinpay retailer counter.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="BBPS"
      title="The bill comes in on paper. It goes out from the till."
      art="bbps"
      lead="Customer gives you a CA number, a policy number, or a loan account. You fetch what is due, take cash, and pay from your retailer wallet. Same hold-then-capture as a money transfer."
    >
      <p>Categories on the till: electricity, water, piped gas, broadband, LPG, credit card, loan EMI, general insurance, school fees, and municipal tax.</p>
      <p>Billers that require a fetch must be fetched first. The amount on the bill is shown before the wallet is debited. Commission is split when the payment succeeds.</p>
    </ServiceLayout>
  );
}
