"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminBanksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings?tab=banks");
  }, [router]);
  return null;
}
