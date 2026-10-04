import { ServiceLayout, serviceMeta } from "@/features/marketing/ServiceLayout";

export const metadata = serviceMeta(
  "/services/agent-wallet",
  "Pre-Funded Retailer Wallet",
  "Pre-funded operational wallet with double-entry accounting. Top up in seconds via UPI.",
);

export default function Page() {
  return (
    <ServiceLayout
      kicker="Operational Wallet"
      title="Load Wallet & Start Transacting Instantly"
      art="wallet"
      commission="Zero Loading Charges (Free UPI Top-Up)"
      lead="Top up your working float in 10 seconds via dynamic UPI QR or Netbanking. Never worry about minus balances or overdraft debts — every rupee is safeguarded by an append-only double-entry ledger."
      partners={[
        "Instant UPI Load",
        "Virtual Account NEFT/RTGS",
        "QR Code Self-Topup",
        "Sponsor Bank Escrow",
        "Auto-Reversal on Timeout",
      ]}
      steps={[
        { step: "01", title: "Top Up via UPI", desc: "Scan QR with PhonePe or GPay to add float instantly without fees." },
        { step: "02", title: "Serve Walk-in Customers", desc: "Send money, pay bills, and dispense cash from available balance." },
        { step: "03", title: "Earn Instant Commission", desc: "Every transaction fee and commission splits into your wallet in real-time." },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Hold-Then-Capture Protection</p>
          <p className="text-xs text-slate-500 mt-1">If bank servers timeout, funds are safely held and automatically returned within seconds. Zero phantom debits.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-navy-950 text-sm">Passbook Digital Statement</p>
          <p className="text-xs text-slate-500 mt-1">Filter transactions by date, download daily GST statements, and match your counter cash in seconds.</p>
        </div>
      </div>
    </ServiceLayout>
  );
}
