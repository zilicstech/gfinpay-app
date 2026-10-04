import type { Metadata } from "next";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Contact Gfinpay",
  description: "Partner with Gfinpay for BC networks, DMT, AePS and BaaS last-mile distribution.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
