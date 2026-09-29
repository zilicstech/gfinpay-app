import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta("/solutions/retailers", "For retailers", "Send money, pay bills, recharge, give cash, and help with cards from your kirana retailer outlet.");

export default function Page() {
  return (
    <ServiceLayout
      kicker="Retailers"
      title="A bank counter at your retailer outlet."
      art="upi"
      lead="A phone on the counter is enough. Add money to the wallet, serve the queue, and see if a transfer is waiting, sent, or failed — without calling the distributor."
    >
      <p>Big buttons, rupee amounts, and a bottom menu on the phone. Built for a retailer that also sells oil and SIM cards.</p>
    </ServiceLayout>
  );
}
