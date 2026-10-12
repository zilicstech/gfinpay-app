"use client";

import { AppShell } from "@/features/shell/AppShell";

const NAV = [
  { href: "/auditor/overview", label: "Overview" },
  { href: "/auditor/requests", label: "Requests" },
  { href: "/auditor/retailers", label: "Retailers" },
  { href: "/auditor/customers", label: "Customers" },
  { href: "/auditor/settings", label: "Settings" },
];

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Auditor" allowedTypes={["AUDITOR"]} nav={NAV}>
      {children}
    </AppShell>
  );
}
