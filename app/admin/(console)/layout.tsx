"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { useSession } from "@/stores/session.store";

const SUPER_NAV = [
  { href: "/admin/analytics", label: "Overview" },
  { href: "/admin/distributors", label: "Distributors" },
  { href: "/admin/retailers", label: "Retailers" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/recon", label: "Recon" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/earnings", label: "Earnings" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/settings", label: "Settings" },
];

const HUB_NAV = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/distributors", label: "Distributors" },
  { href: "/admin/retailers", label: "Retailers" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/earnings", label: "Earnings" },
];

const SUPER_ONLY = [
  "/admin/admins",
  "/admin/settings",
  "/admin/analytics",
  "/admin/recon",
  "/admin/reports",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const userType = useSession((s) => s.user?.userType);
  const pathname = usePathname();
  const router = useRouter();
  const nav = userType === "ADMIN" ? HUB_NAV : SUPER_NAV;

  useEffect(() => {
    if (userType !== "ADMIN") return;
    if (SUPER_ONLY.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      router.replace("/admin/overview");
    }
  }, [pathname, router, userType]);

  return (
    <AppShell title="Admin" allowedTypes={["SUPER_ADMIN", "ADMIN"]} loginHref="/login" nav={nav}>
      {children}
    </AppShell>
  );
}
