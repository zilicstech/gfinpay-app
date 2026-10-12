import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/bbps",
  "Bill Pay (BBPS)",
  "Pay electricity, water, gas, broadband, LPG, credit card, and municipal bills from your retailer counter.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Bharat BillPay (BBPS)"
      title="Pay Electricity & Utility Bills at Your Store"
      art="bbps"
      lead="Customer brings their paper bill or CA number. Enter the number, fetch the live amount, accept cash, and pay instantly from your wallet. Provide printed or WhatsApp receipt."
      partners={[
        "Tata Power",
        "Adani Electricity",
        "BSES Rajdhani",
        "UPPCL",
        "WBSEDCL",
        "Mahanagar Gas",
        "Indane Gas",
        "BESCOM",
      ]}
      steps={[
        { step: "01", title: "Enter Consumer Number", desc: "Customer provides Consumer CA number or mobile." },
        { step: "02", title: "Fetch Live Bill & Collect Cash", desc: "Real-time bill fetch confirms exact amount due." },
        { step: "03", title: "Instant Receipt Generation", desc: "Instant BBPS reference ID generated & official NPCI receipt issued." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">100+ Live Billers</p>
          <p className="text-xs text-slate-500 mt-1">Electricity, Water, Piped Gas, Broadband, Loan EMI, School Fees, and Municipal Tax.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Direct NPCI Receipt</p>
          <p className="text-xs text-slate-500 mt-1">Legally valid digital receipt with BBPS transaction reference for customer peace of mind.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
