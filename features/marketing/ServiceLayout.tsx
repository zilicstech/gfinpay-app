import type { ReactNode } from "react";
import Link from "next/link";
import { LedgerArt, ServiceArt } from "@/components/illustrations/HomeArt";
import { seo } from "@/lib/seo";

export function serviceMeta(path: string, title: string, description: string) {
  return seo({ title, description, path });
}

export function ServiceLayout({
  title,
  kicker,
  lead,
  art,
  children,
}: {
  title: string;
  kicker: string;
  lead: string;
  art?: "dmt" | "aeps" | "upi" | "wallet" | "cards" | "network" | "ledger" | "bbps" | "recharge" | "fastag" | "lic";
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium text-brand-700">{kicker}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-navy-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-navy-700">{lead}</p>
        </div>
        {art ? (
          <div>
            {art === "ledger" ? <LedgerArt /> : <ServiceArt kind={art} />}
          </div>
        ) : null}
      </div>
      <div className="mt-10 max-w-3xl space-y-4 leading-relaxed text-navy-700">{children}</div>
      <Link href="/contact" className="btn-navy mt-10 inline-flex">Talk to us</Link>
    </article>
  );
}
