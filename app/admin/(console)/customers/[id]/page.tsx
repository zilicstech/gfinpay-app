"use client";

import { CustomerHistory } from "@/features/sales/CustomerHistory";

export default function AdminCustomerDetailPage() {
  return <CustomerHistory basePath="/admin/customers" />;
}
