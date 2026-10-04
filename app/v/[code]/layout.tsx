import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Vendor Partner Console — Gfinpay",
  description:
    "Gfinpay Vendor Partner Console. Generate persistent application desk links for your field and store staff to issue secured FD credit cards.",
};

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
