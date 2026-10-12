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
      title="Provide Guaranteed Credit Cards & Personal Loans to Customers"
      art="cards"
      lead="Help walk-in customers get Fixed Deposit-backed credit cards and digital loans. 100% approval even with zero CIBIL score. Customer completes paperless KYC on their smartphone with instant digital approval."
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
        { step: "03", title: "Instant Virtual Card Issued", desc: "Bank confirms card issuance and virtual card is instantly active on the customer's phone." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">No CIBIL Score Needed</p>
          <p className="text-xs text-slate-500 mt-1">100% guaranteed approval for first-time credit borrowers backed by their own fixed deposit with bank interest benefits.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Zero Cash Liability for Retailer</p>
          <p className="text-xs text-slate-500 mt-1">Customer deposits funds directly from their personal bank account under RBI AML compliance. You never touch the FD cash.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
