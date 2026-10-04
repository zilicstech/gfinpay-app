import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/bc-network",
  "Retailer & Distributor Network",
  "Tiered Business Correspondent hierarchy with automated commission splits and verified KYC onboarding.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="BC Distribution Network"
      title="Build Your Retailer Network & Earn on Every Transaction"
      art="network"
      commission="Automated Distributor Commission Split (Passive Income)"
      lead="Appoint Kirana stores and retailers across your city, district, or state. Every time your retailer sends money or pays a bill, distributor commission credits directly to your account in real-time."
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
        { step: "03", title: "Earn Network Commissions", desc: "Earn passive margin on every transaction across your entire network." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Automated Split Engine</p>
          <p className="text-xs text-slate-500 mt-1">Zero manual bookkeeping. The platform splits retailer and distributor commission automatically at the exact millisecond of bank settlement.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Real-Time Network Monitoring</p>
          <p className="text-xs text-slate-500 mt-1">Track active retailers, top-performing stores, daily Gross Transaction Volume (GTV), and pending approvals from one master dashboard.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
