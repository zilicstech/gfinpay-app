"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SITE } from "@/lib/site";

const HUBS = [
  { city: "Kolkata", note: "Registered HQ & Eastern Operations" },
  { city: "Mumbai", note: "Banking & Sponsor Bank Switch" },
  { city: "Bengaluru", note: "Product & Engineering Hub" },
  { city: "Hyderabad", note: "Southern Distribution Centre" },
];

export default function ContactPage() {
  const [persona, setPersona] = useState<"retailer" | "distributor" | "bank" | "vendor">("distributor");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="d2c-badge mb-3">
                <Headphones className="h-3.5 w-3.5 text-brand-600" />
                <span>We're Here to Help</span>
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-navy-950">
                Let's build financial access together.
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Whether you want to become a regional Master Distributor, onboard your Kirana outlet, or integrate your banking institution — our operations team is ready.
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-3">
              <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-600 ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                  <Phone className="h-5 w-5 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Toll-Free Retailer Helpline</p>
                  <p className="font-display text-base font-bold text-navy-950">{SITE.phone}</p>
                  <p className="text-[11px] text-slate-400">Monday - Saturday (9:00 AM - 7:00 PM IST)</p>
                </div>
              </div>

              <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-600 ring-1 ring-inset ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 group-hover:[&_*]:!text-white group-hover:[&_svg]:!text-white">
                  <Mail className="h-5 w-5 transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Partnership & Distribution Inquiries</p>
                  <p className="font-display text-sm font-bold text-navy-950">{SITE.partnerEmail}</p>
                  <p className="text-[11px] text-slate-400">Direct response within 24 business hours</p>
                </div>
              </div>
            </div>

            {/* Regional Hubs */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Our Regional Hubs</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {HUBS.map((h) => (
                  <div key={h.city} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                    <p className="font-bold text-navy-950 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      {h.city}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{h.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="rounded-[2.5rem] border border-slate-200/90 bg-white p-7 sm:p-10 shadow-xl">
              {sent ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-navy-950">Thank you, {name}!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your inquiry has been routed to our regional territory lead for <strong>{city || "your area"}</strong>. We will contact you at <strong>{email || mobile}</strong> shortly.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setSent(false)}
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-bold text-navy-950">Send an Inquiry</h2>
                    <p className="text-xs text-slate-500 mt-1">Select your profile to connect with the right desk.</p>
                  </div>

                  {/* Persona Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "distributor", label: "Distributor" },
                      { id: "retailer", label: "Kirana Agent" },
                      { id: "bank", label: "Bank / BaaS" },
                      { id: "vendor", label: "Vendor Partner" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPersona(tab.id as typeof persona)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          persona === tab.id
                            ? "bg-navy-950 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        className="field"
                        required
                        placeholder="e.g. Anand Patel"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        className="field"
                        required
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Email Address
                      </label>
                      <input
                        className="field"
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        City & State
                      </label>
                      <input
                        className="field"
                        required
                        placeholder="e.g. Pune, Maharashtra"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Tell us what you want to achieve
                    </label>
                    <textarea
                      className="field min-h-28 text-sm"
                      placeholder="Briefly describe your existing retail store count, area of operation, or product interest..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full shadow-lg shadow-emerald-500/25 !py-3.5 font-bold"
                  >
                    <span>Submit Inquiry</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    We respect your privacy. A real representative replies within 24 hours.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
