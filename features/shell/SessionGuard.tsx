"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutSession, refreshSession } from "@/lib/auth-client";
import { isActivityKey, lastActivityAt, markActivity } from "@/lib/session-activity";
import {
  hasSessionHint,
  homePathFor,
  isSessionExpired,
  useSession,
  useSessionHydrated,
} from "@/stores/session.store";

/** Mirrors app.auth.idle-minutes on the API. */
const IDLE_MS = 30 * 60 * 1000;
/** Rotate once the access token has less than this left, so it never expires mid-use. */
const REFRESH_LEAD_MS = 5 * 60 * 1000;
const TICK_MS = 60 * 1000;

/** Propagates a sign-out to every open tab. */
const LOGOUT_KEY = "fintech-logout";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;

/**
 * Owns the client half of the session policy:
 * restores the in-memory access token from the refresh cookie on load, rotates it while the
 * user is active, signs them out after 30 idle minutes, and keeps every tab in step.
 */
export function SessionGuard() {
  const router = useRouter();
  const hydrated = useSessionHydrated();

  // Silent bootstrap: the access token is memory-only, so a reload has to re-earn it from
  // the cookie. Skipped entirely for visitors who have never signed in on this browser.
  useEffect(() => {
    if (!hydrated) return;
    if (useSession.getState().bootstrapped) return;
    if (!hasSessionHint()) {
      useSession.getState().setBootstrapped();
      return;
    }
    // The server still holds the authoritative idle clock, so a genuinely stale
    // session is refused even though we reset the local stamp here.
    markActivity();
    void refreshSession();
  }, [hydrated]);

  // Record real user interaction. Background polling deliberately does not count.
  useEffect(() => {
    if (!hydrated) return;
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      markActivity();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );
    return () => ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
  }, [hydrated]);

  // Idle sign-out and proactive rotation.
  useEffect(() => {
    if (!hydrated) return;

    async function signOut(reason?: "idle") {
      try {
        window.localStorage.setItem(LOGOUT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      await logoutSession();
      router.replace(homePathFor(reason));
    }

    function tick() {
      const { token, expiresAt } = useSession.getState();
      if (!token) return;
      if (Date.now() - lastActivityAt() > IDLE_MS) {
        void signOut("idle");
        return;
      }
      const expiry = Date.parse(expiresAt ?? "");
      if (!Number.isFinite(expiry)) return;
      if (expiry - Date.now() <= REFRESH_LEAD_MS) {
        void refreshSession();
      }
    }

    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, [hydrated, router]);

  // A sign-out or token rotation in a sibling tab applies here too.
  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key === LOGOUT_KEY) {
        useSession.getState().clear();
        router.replace(homePathFor());
        return;
      }
      // Another tab saw activity while this one holds an expired token.
      if (isActivityKey(event.key) && useSession.getState().token) {
        if (isSessionExpired(useSession.getState().expiresAt)) {
          void refreshSession();
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated, router]);

  return null;
}
