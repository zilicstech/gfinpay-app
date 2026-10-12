import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/lic",
  "LIC Insurance Premium",
  "Collect Life Insurance Corporation and general insurance premiums with live policy fetch.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Insurance Premium"
      title="Collect LIC Premiums at Your Store & Issue Instant Receipts"
      art="lic"
      lead="Neighborhood customers no longer need to stand in long queues at branch offices. Enter policy number, fetch exact due amount with late fee calculations, accept cash, and generate an official receipt."
      partners={[
        "Life Insurance Corporation (LIC)",
        "SBI Life",
        "HDFC Life",
        "ICICI Prudential",
        "Max Life",
        "Tata AIA",
      ]}
      steps={[
        { step: "01", title: "Enter Policy Number", desc: "Type 9-digit LIC policy number and policyholder mobile." },
        { step: "02", title: "Fetch Live Premium Due", desc: "System verifies due date, installment amount, and grace period." },
        { step: "03", title: "Accept Cash & Issue Official Receipt", desc: "Wallet executes payment; official LIC transaction receipt prints instantly." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Official LIC Reference</p>
          <p className="text-xs text-slate-500 mt-1">Direct tie-up provides instant policy ledger clearance and official valid tax-exemption receipt.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">High Customer Trust</p>
          <p className="text-xs text-slate-500 mt-1">Regular policyholders visit every quarter or year, creating sticky, high-loyalty counter footfall.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
