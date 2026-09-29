import Link from "next/link";
import { HeroKirana, LedgerArt, ServiceArt } from "@/components/illustrations/HomeArt";
import { SITE } from "@/lib/site";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: `${SITE.name} — Send money, pay bills, and give cash from your retailer outlet`,
  description: SITE.description,
  path: "/",
});

const services = [
  {
    kind: "dmt" as const,
    href: "/services/domestic-money-transfer",
    title: "Send money to any bank account",
    body: "Customer gives you cash. You send it to their family by IMPS or NEFT. Limit is ₹5,000 per send and ₹25,000 in a month. You need their mobile, ID, and an OTP.",
  },
  {
    kind: "aeps" as const,
    href: "/services/aeps",
    title: "Give cash with Aadhaar",
    body: "Customer puts thumb on the machine. Money comes from their bank. You give cash from the retailer counter. We only keep last 4 digits of Aadhaar — never the fingerprint.",
  },
  {
    kind: "upi" as const,
    href: "/services/upi-cash-out",
    title: "UPI to cash",
    body: "Show a QR. Customer pays from PhonePe or GPay and enters UPI PIN. After it shows paid, give them cash. Maximum ₹5,000 at a time.",
  },
  {
    kind: "wallet" as const,
    href: "/services/agent-wallet",
    title: "Your retailer wallet",
    body: "Add money first, then do business. You cannot send more than the balance. If a transfer fails, the money comes back to your wallet.",
  },
  {
    kind: "bbps" as const,
    href: "/services/bbps",
    title: "Pay electricity and other bills",
    body: "Customer brings a CA number or a policy number. You fetch the bill, take cash, and pay from your wallet. Electricity, water, gas, broadband, LPG, credit card, loan, education, and municipal — all on BBPS.",
  },
  {
    kind: "recharge" as const,
    href: "/services/recharge",
    title: "Mobile and DTH recharge",
    body: "Airtel, Jio, Vi, BSNL, Tata Play, Dish TV. Pick a plan or type an amount. The wallet is debited before the operator is credited.",
  },
  {
    kind: "fastag" as const,
    href: "/services/fastag",
    title: "FASTag recharge",
    body: "Enter the vehicle number. Some banks show the outstanding first. You pay from the wallet and hand over the receipt.",
  },
  {
    kind: "lic" as const,
    href: "/services/lic",
    title: "Collect an LIC premium",
    body: "Fetch the premium on the policy number, then pay. Same wallet hold as a bill. Commission posts when it succeeds.",
  },
  {
    kind: "cards" as const,
    href: "/services/fd-credit-cards",
    title: "Help with an FD credit card",
    body: "You collect ID and PAN. Customer puts money in a fixed deposit from their own phone. You never take that cash at the counter. The retailer earns a fee when the card is issued.",
  },
  {
    kind: "network" as const,
    href: "/services/bc-network",
    title: "Retailers, distributors, and admin",
    body: "Admin appoints distributors. Distributors add retailers. There is no public signup. Commission is split when a transfer succeeds.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-medium text-navy-500">{SITE.name} · India</p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-navy-950 sm:text-4xl lg:text-[2.7rem]">
              Banking services for kirana retailers.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy-700">
              Customers walk in with cash. You send money to a bank account, pay a bill, recharge a phone, give cash against UPI, or help them take an FD card. Add money to your wallet first — then serve the queue.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-navy px-6">Login</Link>
              <Link href="/services" className="btn-secondary">See what you can do</Link>
            </div>
            <p className="mt-6 text-sm text-navy-600">
              Used by retailers, distributors, and banks across India.
            </p>
          </div>
          <div>
            <HeroKirana />
            <p className="mt-3 text-center text-xs text-navy-600">Bill pay, send money, cash, cards — from one {SITE.name} counter.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 text-sm text-navy-700 lg:px-8">
          <span>Send money (DMT)</span>
          <span>BBPS bills</span>
          <span>Mobile & DTH</span>
          <span>FASTag</span>
          <span>LIC premium</span>
          <span>Aadhaar cash</span>
          <span>UPI to cash</span>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <p className="text-sm font-medium text-navy-500">What you can do at the retailer counter</p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-navy-950">
            Same services as a small bank counter. Run by someone the customer already knows.
          </h2>
          <p className="mt-4 max-w-2xl text-navy-700">
            Send money, pay bills, recharge, give cash, keep a wallet, and help with cards. You cannot go below zero. Every rupee is recorded.
          </p>
          <div className="mt-14 space-y-16">
            {services.map((s, i) => (
              <article
                key={s.href}
                className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}
              >
                <div>
                  <ServiceArt kind={s.kind} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy-500">0{i + 1}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-navy-950 sm:text-3xl">{s.title}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-navy-700">{s.body}</p>
                  <Link href={s.href} className="mt-5 inline-block text-sm font-semibold text-navy-950 underline decoration-black/30 underline-offset-4">
                    How it works
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <p className="text-sm font-medium text-navy-500">A walk-in customer</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-950">Four steps. A few minutes.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              ["Customer comes in", `Cash in hand, or a UPI app open. They do not need a ${SITE.name} account.`],
              ["You take details", "Mobile and ID for sending money. Name and mobile for cash. QR for UPI."],
              ["Wallet is locked", "The amount is held in your wallet before the bank is called."],
              ["Done", "When the bank confirms, you get a receipt. Your commission is added the same time."],
            ].map(([t, b], i) => (
              <li key={t}>
                <p className="font-display text-4xl font-semibold text-navy-950">{i + 1}</p>
                <h3 className="mt-3 text-lg font-semibold text-navy-950">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-700">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-medium text-navy-500">How money is kept</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-950">Every rupee is written in a passbook that cannot be edited.</h2>
            <p className="mt-4 leading-relaxed text-navy-700">
              You add money to the wallet first. When you send, that amount is held. If the bank succeeds, it is taken. If it fails, it comes back. Commission is split when the transfer is successful.
            </p>
            <p className="mt-4 leading-relaxed text-navy-700">
              Customers do not get a {SITE.name} wallet. Their money stays in their own bank.
            </p>
          </div>
          <div>
            <LedgerArt />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-950">Who uses {SITE.name}.</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Link href="/solutions/retailers" className="rounded-3xl bg-black p-8 text-white">
              <p className="text-neutral-400">Retailer</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">You run the counter.</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">Phone on the table. Wallet on top. Send money, bills, recharge, cash, and cards — next to oil and SIM cards.</p>
            </Link>
            <Link href="/solutions/distributors" className="rounded-3xl border border-black/10 bg-neutral-50 p-8">
              <p className="text-navy-500">Distributor</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-navy-950">You look after the area.</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-700">See retailers, balances, and your commission. You do not handle customer cash.</p>
            </Link>
            <Link href="/solutions/enterprises" className="rounded-3xl border border-black/10 p-8">
              <p className="text-navy-500">Bank / partner</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-navy-950">You hold the licence.</h3>
              <p className="mt-3 text-sm leading-relaxed text-navy-700">You keep accounts and cards. We keep retailers, wallets, and a daily file you can match.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-950">What we will not do</h2>
            <ul className="mt-5 space-y-3 text-navy-700">
              <li>Hold customer deposits or run a public app for everyone.</li>
              <li>Let a retailer send money on credit — wallet must have balance first.</li>
              <li>Let you collect FD cash at the counter.</li>
              <li>Allow anyone to sign up. Retailers are appointed.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-950">What an auditor will find</h2>
            <ul className="mt-5 space-y-3 text-navy-700">
              <li>Monthly send-money limits locked so two sends cannot overshoot.</li>
              <li>Aadhaar last-4 only. No fingerprint stored.</li>
              <li>PAN last-4 only on the till.</li>
              <li>Day-end files that match the bank, not a screenshot.</li>
            </ul>
            <Link href="/compliance" className="mt-6 inline-block text-sm font-semibold text-navy-950 underline decoration-black/30 underline-offset-4">
              Read how we stay compliant
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:flex lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight">If you run retailers or a bank rail — write to us.</h2>
            <p className="mt-3 text-neutral-400">We add distributors and retailers ourselves. There is no public signup. A person replies, not a bot.</p>
          </div>
          <Link href="/contact" className="btn mt-6 bg-white px-6 text-black hover:bg-neutral-100">Email us</Link>
        </div>
      </section>
    </>
  );
}
