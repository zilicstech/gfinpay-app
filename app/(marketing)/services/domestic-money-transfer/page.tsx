import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/domestic-money-transfer",
  "Money Transfer (DMT)",
  "Instant money remittance to any bank in India over IMPS and NEFT directly from your retailer counter.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Money Transfer (DMT)"
      title="Transfer Customer Cash to Any Bank Account Instantly"
      art="dmt"
      commission="0.50% Margin (Flat ₹25 to ₹75 per transfer)"
      lead="Customer gives cash. You send money instantly to any bank account in India over IMPS 24x7. Real-time name verification ensures 100% correct account transfers."
      partners={[
        "State Bank of India",
        "HDFC Bank",
        "ICICI Bank",
        "Punjab National Bank",
        "Bank of Baroda",
        "Kotak Mahindra Bank",
        "Canara Bank",
        "Union Bank",
      ]}
      steps={[
        { step: "01", title: "Enter Mobile & Account", desc: "Customer provides phone number and recipient account number + IFSC." },
        { step: "02", title: "Verify Account Holder Name", desc: "Penny-drop validation verifies recipient name before sending." },
        { step: "03", title: "Instant Transfer & Commission", desc: "Money transfers in 5 seconds via IMPS & commission enters your wallet." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">24x7 Instant IMPS</p>
          <p className="text-xs text-slate-500 mt-1">Works on Sundays and bank holidays. Instant delivery confirmation SMS to sender.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">₹25,000 Monthly Limit</p>
          <p className="text-xs text-slate-500 mt-1">Automatic RBI monthly ceiling tracking per customer. Zero legal hassle for shopkeeper.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
