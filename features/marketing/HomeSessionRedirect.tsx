"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NeonSpinner } from "@/components/ui/GlobalLoader";
import { hasSessionHint, homeFor, useSession, useSessionHydrated } from "@/stores/session.store";

/**
 * Keeps the landing page for visitors only: a signed-in user is sent to their own dashboard.
 * Other marketing pages stay readable while signed in.
 */
export function HomeSessionRedirect() {
  const router = useRouter();
  const hydrated = useSessionHydrated();
  const { token, user, bootstrapped } = useSession();
  // Session hints live in localStorage, which the server cannot see. The first paint must
  // match the server (nothing) or React throws a hydration error.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !bootstrapped) return;
    if (token && user?.userType) {
      router.replace(homeFor(user.userType, user.status));
    }
  }, [bootstrapped, hydrated, router, token, user]);

  // Only a browser that previously held a session can be waiting on a silent refresh, so
  // anonymous visitors never see this and the page paints immediately.
  const resolving = mounted && hydrated && !bootstrapped && hasSessionHint();
  if (!resolving && !(mounted && token && user?.userType)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white">
      <NeonSpinner />
    </div>
  );
}
