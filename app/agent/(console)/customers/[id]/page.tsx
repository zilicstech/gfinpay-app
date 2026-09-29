"use client";

import { CustomerHistory } from "@/features/sales/CustomerHistory";

export default function AgentCustomerDetailPage() {
  return <CustomerHistory basePath="/agent/customers" manage />;
}
