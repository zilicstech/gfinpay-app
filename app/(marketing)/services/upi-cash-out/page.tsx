import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/upi-cash-out",
  "UPI to Cash",
  "Customer scans dynamic QR with PhonePe or GPay. You hand over cash once confirmed on your screen.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="UPI Cash-Out"
      title="Customer Scans UPI QR, You Hand Over Cash"
      art="upi"
      commission="0.40% Instant Margin (Instant Wallet Settlement)"
      lead="Display a dynamic UPI QR code on your mobile screen. Customer scans with PhonePe, Google Pay, or Paytm and authorizes with UPI PIN. Once the green checkmark shows, hand over physical cash notes."
      partners={[
        "PhonePe",
        "Google Pay (GPay)",
        "Paytm UPI",
        "BHIM UPI",
        "Cred UPI",
        "Amazon Pay",
      ]}
      steps={[
        { step: "01", title: "Generate Dynamic QR", desc: "Type amount in app; dynamic UPI QR generates instantly on your screen." },
        { step: "02", title: "Customer Scans & Authorizes", desc: "Customer scans with any UPI app and authorizes payment with their UPI PIN." },
        { step: "03", title: "Dispense Cash & Keep Commission", desc: "Funds land in your wallet with sound alert; hand over cash to customer." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">No Hardware Needed</p>
          <p className="text-xs text-slate-500 mt-1">No soundbox rental fee or expensive card swipe machine required. Runs 100% on your phone.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Zero Chargeback Risk</p>
          <p className="text-xs text-slate-500 mt-1">Authenticated UPI PIN transaction guarantees irreversible settlement directly to your wallet.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
