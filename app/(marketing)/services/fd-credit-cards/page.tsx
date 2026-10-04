import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/fd-credit-cards",
  "FD Credit Cards & Loans",
  "Help customers get guaranteed secured credit cards and personal loans without paper documents.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Digital Banking Products"
      title="Provide Credit Cards to Customers & Earn High Commissions"
      art="cards"
      commission="₹800 to ₹2,900 per approved card (Highest Margin)"
      lead="Help walk-in customers get Fixed Deposit-backed credit cards and digital loans. 100% approval even with zero CIBIL score. Customer completes paperless KYC on their smartphone; you earn big commissions."
      partners={[
        "SBM Bank India",
        "Indian Overseas Bank",
        "Kotak Mahindra Bank",
        "RuPay Credit Rails",
        "Visa Platinum",
      ]}
      steps={[
        { step: "01", title: "Customer PAN & Mobile", desc: "Enter basic details on your desk terminal with customer consent." },
        { step: "02", title: "Instant Link to Customer Phone", desc: "Customer receives encrypted SMS/WhatsApp link to fund their own FD via UPI." },
        { step: "03", title: "Card Issued & High Commission", desc: "Once the bank confirms card issuance, ₹800 to ₹2,900 credits to your wallet." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">No CIBIL Score Needed</p>
          <p className="text-xs text-slate-500 mt-1">100% guaranteed approval for first-time credit borrowers backed by their own fixed deposit earning bank interest.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Zero Cash Liability for Retailer</p>
          <p className="text-xs text-slate-500 mt-1">Customer deposits funds directly from their personal bank account under RBI AML compliance. You never touch the FD cash.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
