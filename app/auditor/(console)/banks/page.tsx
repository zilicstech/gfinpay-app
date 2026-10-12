"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuditorBanksRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auditor/settings?tab=banks");
  }, [router]);
  return null;
}
