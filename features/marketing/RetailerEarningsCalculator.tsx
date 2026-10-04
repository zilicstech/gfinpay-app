"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, IndianRupee, Sparkles, TrendingUp, Users } from "lucide-react";
import { inr } from "@/lib/format";

export function RetailerEarningsCalculator() {
  const [dmtPerDay, setDmtPerDay] = useState(12);
  const [billsPerDay, setBillsPerDay] = useState(25);
  const [cardsPerWeek, setCardsPerWeek] = useState(4);

  // Realistic average commission calculation:
  // DMT: ~₹18 average retailer commission per transfer
  // Bills & Recharge: ~₹6 average commission per bill
  // FD Cards & Loans: ~₹1,800 average payout per converted card/lead
  const monthlyDmt = dmtPerDay * 30 * 18;
  const monthlyBills = billsPerDay * 30 * 6;
  const monthlyCards = (cardsPerWeek * 4.33) * 1800;

  const totalMonthly = Math.round(monthlyDmt + monthlyBills + monthlyCards);
  const totalAnnual = totalMonthly * 12;
  const monthlyCustomers = (dmtPerDay + billsPerDay) * 30 + Math.round(cardsPerWeek * 4.33);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-6 md:p-12 shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-3xl text-center mb-10">
        <span className="d2c-badge mb-3">
          <Calculator className="h-3.5 w-3.5 text-brand-600" />
          <span>Interactive Commission Simulator</span>
        </span>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-navy-950">
          How much can your Kirana counter earn?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
          Adjust the sliders below to see how adding assisted banking services turns walk-in shoppers into high-margin recurring income.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Sliders Side */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: DMT */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <span>💸 Money Transfers (DMT)</span>
              </label>
              <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 font-display text-sm font-extrabold text-emerald-700">
                {dmtPerDay} / day
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={dmtPerDay}
              onChange={(e) => setDmtPerDay(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-lg bg-slate-200 accent-emerald-500 cursor-pointer"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>1 transfer</span>
              <span>25 transfers</span>
              <span>50 transfers / day</span>
            </div>
          </div>

          {/* Slider 2: Bills & Recharge */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <span>⚡ BBPS Bills & Recharges</span>
              </label>
              <span className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 font-display text-sm font-extrabold text-amber-700">
                {billsPerDay} / day
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={billsPerDay}
              onChange={(e) => setBillsPerDay(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-lg bg-slate-200 accent-amber-500 cursor-pointer"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>5 bills</span>
              <span>50 bills</span>
              <span>100 bills / day</span>
            </div>
          </div>

          {/* Slider 3: FD Cards & Loans */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <span>💳 FD Credit Cards & Loans</span>
              </label>
              <span className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1 font-display text-sm font-extrabold text-indigo-700">
                {cardsPerWeek} / week
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={cardsPerWeek}
              onChange={(e) => setCardsPerWeek(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-lg bg-slate-200 accent-indigo-500 cursor-pointer"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>0 cards</span>
              <span>10 cards</span>
              <span>20 cards / week</span>
            </div>
          </div>
        </div>

        {/* Output Earnings Card */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-navy-950 p-6 sm:p-8 text-white shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Income</span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Zero Inventory Risk
              </span>
            </div>

            <div className="py-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Monthly Store Commission</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {inr(totalMonthly)}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ month</span>
              </div>
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Equivalent to <strong>{inr(totalAnnual)}</strong> additional annual profit</span>
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Footfall
                </p>
                <p className="mt-1 font-display text-base font-bold text-white">~{monthlyCustomers} walk-ins/mo</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-slate-400 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> Settlement
                </p>
                <p className="mt-1 font-display text-base font-bold text-emerald-400">Instant to Wallet</p>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/login"
                className="btn-primary w-full shadow-emerald-500/30 font-bold"
              >
                <span>Launch Your Retailer Desk</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                Are you a distributor? Contact our onboarding team for territorial franchises.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
