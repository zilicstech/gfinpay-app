"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuditorIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auditor/overview");
  }, [router]);
  return null;
}
