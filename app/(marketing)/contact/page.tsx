"use client";

import { FormEvent, useState } from "react";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
      <div>
        <p className="text-sm font-medium text-navy-500">Contact</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">Work with gfinpay.</h1>
        <p className="mt-4 leading-relaxed text-navy-700">Banks, distributors, and retailers — tell us your city and what you want to start. We will get back to you.</p>
        <dl className="mt-8 space-y-3 text-sm text-navy-700">
          <div><dt className="text-navy-500">Partnerships</dt><dd>{SITE.partnerEmail}</dd></div>
          <div><dt className="text-navy-500">General</dt><dd>{SITE.email}</dd></div>
          <div><dt className="text-navy-500">Helpline</dt><dd>{SITE.phone}</dd></div>
        </dl>
      </div>
      <form onSubmit={onSubmit} className="rounded-3xl border border-navy-900/10 bg-white p-6">
        {sent ? (
          <p className="text-sm font-medium text-brand-700">Thank you. We will reply on email.</p>
        ) : (
          <div className="space-y-3">
            <input className="field" required placeholder="Full name" name="name" />
            <input className="field" required type="email" placeholder="Work email" name="email" />
            <input className="field" placeholder="Organisation" name="org" />
            <select className="field" name="interest" defaultValue="distributor">
              <option value="distributor">Become a distributor</option>
              <option value="bank">Sponsor bank / BaaS</option>
              <option value="retailer">Retailer onboarding</option>
            </select>
            <textarea className="field min-h-28" placeholder="What do you want to start?" name="message" />
            <button className="btn-navy w-full">Send</button>
          </div>
        )}
      </form>
    </div>
  );
}
