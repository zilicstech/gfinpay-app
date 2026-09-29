"use client";

import { CustomerHistory } from "@/features/sales/CustomerHistory";

export default function CustomerDetailPage() {
  return <CustomerHistory basePath="/distributor/customers" manage />;
}
