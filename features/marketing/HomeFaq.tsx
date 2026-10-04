"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "Do I need to buy an expensive machine?",
    a: "No! All services (Money Transfer, Bill Pay, Mobile Recharge, and Credit Cards) work 100% on your existing smartphone or computer. You don't need any expensive machine.",
  },
  {
    q: "When does my commission get credited?",
    a: "Instantly. Within 5 seconds of the transaction succeeding, your commission is credited directly into your retailer wallet balance.",
  },
  {
    q: "How do I add money (float) to my wallet?",
    a: "You can load money anytime in 10 seconds using any UPI app (Google Pay, PhonePe, Paytm) with zero extra loading charges.",
  },
  {
    q: "What if a transaction gets stuck or fails?",
    a: "Your money is 100% safe. If the bank switch fails, our double-entry ledger automatically releases the held amount back into your wallet within seconds.",
  },
  {
    q: "Can I become a Master Distributor in my city?",
    a: "Yes! Master Distributors onboard local Kirana stores and earn automatic commission on every transaction across their entire network. Call 1800 890 4040 to apply.",
  },
];

export function HomeFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
              isOpen
                ? "border-emerald-500/40 bg-white shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-semibold text-navy-950 transition"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div className="pr-4 space-y-0.5">
                <p className="text-sm sm:text-base font-bold text-navy-950">{item.q}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-emerald-600" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-3">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
