import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/recharge",
  "Mobile & DTH Recharge",
  "Instant prepaid mobile and DTH recharge from your retailer counter — Jio, Airtel, Vi, BSNL, Tata Play, Dish TV.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Recharge"
      title="Recharge Any Mobile & DTH Service Instantly"
      art="recharge"
      lead="Instant prepaid mobile and DTH top-ups for every network in India. View trending plans, unlimited 5G packs, and DTH annual offers in 1-click."
      partners={[
        "Jio Prepaid",
        "Airtel India",
        "Vodafone Idea (Vi)",
        "BSNL",
        "Tata Play",
        "Airtel Digital TV",
        "Dish TV",
        "Sun Direct",
      ]}
      steps={[
        { step: "01", title: "Select Number & Operator", desc: "Enter 10-digit mobile or DTH subscriber ID." },
        { step: "02", title: "Choose Best Plan", desc: "Browse unlimited talktime, 5G data, and combo packs." },
        { step: "03", title: "Instant Recharge Confirmation", desc: "Recharge confirms in 2 seconds with official operator transaction ID." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Automated Plan Finder (R-Offer)</p>
          <p className="text-xs text-slate-500 mt-1">Shows customer-specific personalized recharge offers directly from telecom switches.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">99.8% Success Rate</p>
          <p className="text-xs text-slate-500 mt-1">Direct API integration ensures zero waiting time and automatic refund on failed attempts.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
