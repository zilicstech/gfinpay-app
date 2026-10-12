"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, isSuperAdminOrPlatformAdmin, useSession } from "@/stores/session.store";

/** Super admin and platform admin — used for auditor management and similar platform-wide admin work. */
export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const user = useSession((s) => s.user);
  const router = useRouter();
  const allowed = isSuperAdminOrPlatformAdmin(user?.userType);

  useEffect(() => {
    if (user && !allowed) {
      router.replace(homeFor(user.userType, user.status));
    }
  }, [allowed, router, user]);

  if (!user || !allowed) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return children;
}
