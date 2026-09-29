import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black text-neutral-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-neutral-400">{SITE.tagline}.</p>
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            {SITE.legalName}
            <br />
            CIN {SITE.cin}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Services</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV.services.map((s) => (
              <li key={s.href}><Link className="hover:text-white" href={s.href}>{s.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/about">About</Link></li>
            <li><Link className="hover:text-white" href="/compliance">Compliance</Link></li>
            <li><Link className="hover:text-white" href="/insights">Insights</Link></li>
            <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" href="/login">Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/legal/privacy">Privacy</Link></li>
            <li><Link className="hover:text-white" href="/legal/terms">Terms</Link></li>
          </ul>
          <p className="mt-6 text-xs text-neutral-500">{SITE.email}<br />{SITE.phone}<br />{SITE.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {SITE.legalName}. CIN {SITE.cin}.
      </div>
    </footer>
  );
}
