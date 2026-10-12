import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/fastag",
  "FASTag Toll Recharge",
  "Instant FASTag toll balance recharge by vehicle registration number from your retailer counter.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="FASTag Toll"
      title="Enter Vehicle Number & Recharge FASTag Instantly"
      art="fastag"
      lead="Commercial drivers and vehicle owners need quick toll recharges. Type vehicle registration number, see current balance, accept cash, and recharge in seconds."
      partners={[
        "SBI FASTag",
        "ICICI FASTag",
        "HDFC FASTag",
        "Paytm Payments Bank",
        "Axis Bank FASTag",
        "IDFC First FASTag",
        "Kotak FASTag",
      ]}
      steps={[
        { step: "01", title: "Enter Vehicle Number", desc: "Type vehicle registration number (e.g. DL01AB1234)." },
        { step: "02", title: "Fetch Balance & Issuer Bank", desc: "Live API fetches issuer bank and current tag balance." },
        { step: "03", title: "Accept Cash & Recharge", desc: "Recharge executes instantly; customer can pass toll plaza immediately." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">All NETC Issuer Banks</p>
          <p className="text-xs text-slate-500 mt-1">Recharge tags issued by SBI, ICICI, HDFC, Axis, and 30+ other NETC banks without switching portals.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Instant Toll Clearance</p>
          <p className="text-xs text-slate-500 mt-1">Tag balance syncs to NHAI toll plazas within 60 seconds, preventing blacklisted toll stops.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
