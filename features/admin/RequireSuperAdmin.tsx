"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdmin, useSession } from "@/stores/session.store";

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const user = useSession((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && !isSuperAdmin(user.userType)) {
      router.replace("/admin/overview");
    }
  }, [router, user]);

  if (!user || !isSuperAdmin(user.userType)) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return children;
}
