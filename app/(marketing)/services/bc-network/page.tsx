import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/bc-network",
  "Retailer & Distributor Network",
  "Tiered Business Correspondent hierarchy with automated real-time settlement and verified KYC onboarding.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="BC Distribution Network"
      title="Build & Scale Your Retailer Network Across Districts"
      art="network"
      lead="Appoint Kirana stores and retailers across your city, district, or state. Oversee transactions, allocate float, and monitor real-time network volume from a unified distributor console."
      partners={[
        "RBI BC Guidelines",
        "Aadhaar Biometric e-KYC",
        "PAN Verification",
        "Automated Territory Management",
        "Real-Time Float Transfer",
      ]}
      steps={[
        { step: "01", title: "Onboard Retailers", desc: "Onboard Kirana stores with verified Aadhaar & PAN KYC." },
        { step: "02", title: "Transfer Float Balance", desc: "Transfer operational balance to your retailers in seconds." },
        { step: "03", title: "Monitor Network Operations", desc: "Track live transaction volume, settle float, and grow your regional distribution." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Automated Settlement Engine</p>
          <p className="text-xs text-slate-500 mt-1">Zero manual bookkeeping. The platform reconciles transactions and ledger settlements automatically at the exact millisecond of bank switch confirmation.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Real-Time Network Monitoring</p>
          <p className="text-xs text-slate-500 mt-1">Track active retailers, top-performing stores, daily Gross Transaction Volume (GTV), and pending approvals from one master dashboard.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
