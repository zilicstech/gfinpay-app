"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentKycRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent/profile");
  }, [router]);
  return null;
}
