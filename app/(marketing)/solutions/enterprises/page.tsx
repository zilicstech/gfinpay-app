import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta("/solutions/enterprises", "For banks", "Use gfinpay retailers for send-money, cash, and cards. You keep the licence. We keep the retailers and the books.");

export default function Page() {
  return (
    <ServiceLayout
      kicker="Banks"
      title="Your bank. Our last mile."
      art="ledger"
      lead="You keep the licence and the bank rails. gfinpay keeps the retailers, wallets, and a daily file you can match."
    >
      <p>Every bank call has a unique key so a retry cannot send twice. Day-end files line up with your MIS.</p>
    </ServiceLayout>
  );
}
