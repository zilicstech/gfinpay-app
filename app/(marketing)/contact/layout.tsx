import type { Metadata } from "next";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Contact gfinpay",
  description: "Partner with gfinpay for BC networks, DMT, AePS and BaaS last-mile distribution.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
