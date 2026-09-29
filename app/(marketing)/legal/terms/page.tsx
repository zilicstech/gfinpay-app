import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = seo({
  title: "Terms of use",
  description: `Terms of use for the ${SITE.name} website and agent platform, operated by ${SITE.legalName}.`,
  path: "/legal/terms",
});

export default function Page() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 text-navy-700 lg:px-8 lg:py-20">
      <h1 className="font-display text-4xl text-navy-950">Terms of use</h1>
      <p className="mt-3 text-sm text-navy-500">
        {SITE.legalName} · CIN {SITE.cin}
      </p>
      <div className="mt-8 space-y-4 leading-relaxed">
        <p>
          These terms govern access to the {SITE.name} website and console. The platform is operated by{" "}
          {SITE.legalName} (CIN {SITE.cin}).
        </p>
        <p>
          Access to the {SITE.name} console is limited to onboarded Super Admins, Master Distributors and Retailers.
          End-customers do not hold accounts on this platform. Financial services are provided through licensed partner
          institutions. These pages are informational and do not constitute a banking licence.
        </p>
        <p>
          Appointed users must keep credentials confidential, follow KYC and transaction limits, and use the console
          only for authorised assisted banking. {SITE.legalName} may suspend access if use is unsafe or outside the
          appointment.
        </p>
        <p>
          Questions: {SITE.email}
        </p>
      </div>
    </article>
  );
}
