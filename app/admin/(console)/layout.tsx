"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/features/shell/AppShell";
import { useSession } from "@/stores/session.store";

const SUPER_NAV = [
  { href: "/admin/analytics", label: "Overview" },
  { href: "/admin/distributors", label: "Distributors" },
  { href: "/admin/retailers", label: "Retailers" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/auditors", label: "Auditors" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/hospi-cash", label: "Hospi Cash" },
  { href: "/admin/recon", label: "Recon" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/earnings", label: "Earnings" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/settings", label: "Settings" },
];

const HUB_NAV = [
  { href: "/admin/analytics", label: "Overview" },
  { href: "/admin/distributors", label: "Distributors" },
  { href: "/admin/retailers", label: "Retailers" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/earnings", label: "Earnings" },
];

const SUPER_ONLY = [
  "/admin/admins",
  "/admin/auditors",
  "/admin/settings",
  "/admin/recon",
  "/admin/reports",
  "/admin/audit",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const userType = useSession((s) => s.user?.userType);
  const pathname = usePathname();
  const router = useRouter();
  const nav = userType === "HUBADMIN" ? HUB_NAV : SUPER_NAV;

  useEffect(() => {
    if (userType !== "HUBADMIN") return;
    if (SUPER_ONLY.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      router.replace("/admin/analytics");
    }
  }, [pathname, router, userType]);

  return (
    <AppShell title="Admin" allowedTypes={["SUPER_ADMIN", "ADMIN", "HUBADMIN"]} nav={nav}>
      {children}
    </AppShell>
  );
}
