"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentEkycRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agent/kyc");
  }, [router]);
  return null;
}
