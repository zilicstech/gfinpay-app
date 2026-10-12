import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/aeps",
  "Aadhaar ATM (AePS)",
  "Dispense cash from your shop counter using Aadhaar biometric authentication.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Aadhaar ATM (AePS)"
      title="Turn Your Shop into a Neighborhood Aadhaar ATM"
      art="aeps"
      lead="Customer scans their thumb on your biometric scanner. Cash is debited from their bank account and credited into your retailer wallet. Hand over physical cash to the customer."
      partners={[
        "Mantra Biometrics",
        "Morpho Safran",
        "Startek",
        "UIDAI Aadhaar",
        "NPCI AePS Rail",
        "All 120+ Indian Banks",
      ]}
      steps={[
        { step: "01", title: "Select Bank & Aadhaar Number", desc: "Customer provides 12-digit Aadhaar number and selects bank name." },
        { step: "02", title: "Scan Fingerprint", desc: "Customer places thumb on biometric scanner for secure verification." },
        { step: "03", title: "Dispense Cash & Complete", desc: "Wallet balance credited immediately; hand over cash notes to customer." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">No ATM Card Needed</p>
          <p className="text-xs text-slate-500 mt-1">Village & neighborhood customers can withdraw cash without remembering debit card PINs.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Balance Inquiry & Mini-Statement</p>
          <p className="text-xs text-slate-500 mt-1">Check remaining account balance and print last 5 transactions for customer convenience.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
