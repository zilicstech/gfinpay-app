"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpiCashoutPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent/cash");
  }, [router]);
  return null;
}
