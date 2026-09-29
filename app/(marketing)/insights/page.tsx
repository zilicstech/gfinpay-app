import Link from "next/link";
import { seo } from "@/lib/seo";

export const metadata = seo({
  title: "Insights",
  description: "Notes on assisted banking, BC networks and last-mile payments infrastructure in India.",
  path: "/insights",
});

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-20">
      <p className="text-sm font-medium text-navy-500">Insights</p>
      <h1 className="mt-3 font-display text-3xl text-navy-950 sm:text-4xl">Why the last mile still uses cash.</h1>
      <Link href="/insights/assisted-banking-india" className="mt-10 block rounded-3xl border border-navy-900/10 bg-white p-6">
        <p className="text-xs text-navy-500">Essay</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-navy-950">Why assisted banking still outperforms super-apps in Bharat</h2>
        <p className="mt-2 text-sm text-navy-700">DMT limits, AePS, and kirana trust — the operating thesis behind gfinpay.</p>
      </Link>
    </div>
  );
}
