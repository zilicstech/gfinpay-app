"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NAV } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/8 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-navy-700 lg:flex">
          <Link href="/about" className="hover:text-navy-950">About</Link>
          <Mega label="Services" items={NAV.services.map((s) => ({ href: s.href, label: s.label, blurb: s.blurb }))} />
          <Link href="/compliance" className="hover:text-navy-950">Compliance</Link>
          <Link href="/insights" className="hover:text-navy-950">Insights</Link>
          <Link href="/contact" className="hover:text-navy-950">Contact</Link>
        </nav>
        <div className="hidden lg:block">
          <Link href="/login" className="btn-navy min-h-10 px-5">Login</Link>
        </div>
        <button className="text-navy-900 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-black/8 px-4 py-4 lg:hidden">
          {[...NAV.services, { href: "/about", label: "About" }, { href: "/compliance", label: "Compliance" }, { href: "/contact", label: "Contact" }].map((item) => (
            <Link key={item.href} href={item.href} className="block text-sm text-navy-800" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="btn-navy mt-2 w-full" onClick={() => setOpen(false)}>Login</Link>
        </div>
      )}
    </header>
  );
}

function Mega({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; blurb?: string }[];
}) {
  return (
    <div className="group relative">
      <button className="inline-flex items-center gap-1 hover:text-navy-950">
        {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 max-h-[28rem] w-[22rem] translate-y-2 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 opacity-0 shadow-card transition group-hover:visible group-hover:translate-y-1 group-hover:opacity-100">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 hover:bg-neutral-50">
            <p className="text-sm text-navy-950">{item.label}</p>
            {item.blurb && <p className="text-xs text-navy-600">{item.blurb}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
