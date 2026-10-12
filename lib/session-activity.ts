/**
 * Last real user interaction, shared across tabs so activity in any tab keeps the
 * session alive. Deliberately not fed by background polling or token rotation: only
 * genuine interaction (and a fresh sign-in) may extend the idle window.
 */
const ACTIVITY_KEY = "fintech-activity";

export function markActivity(at: number = Date.now()) {
  try {
    window.localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    /* private mode: the in-tab timers still work */
  }
}

/** Falls back to "now" so a missing entry never reads as idle. */
export function lastActivityAt(): number {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const ms = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(ms) ? ms : Date.now();
  } catch {
    return Date.now();
  }
}

export function isActivityKey(key: string | null): boolean {
  return key === ACTIVITY_KEY;
}
