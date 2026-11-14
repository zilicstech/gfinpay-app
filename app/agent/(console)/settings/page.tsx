"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agent/profile?tab=banks");
  }, [router]);

  return null;
}
