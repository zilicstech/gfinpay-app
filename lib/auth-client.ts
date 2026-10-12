import { API_BASE } from "@/lib/api-base";

/**
 * Cookie-authenticated auth calls. The refresh secret lives in an httpOnly cookie that
 * JavaScript cannot read, so these are the only requests that send credentials.
 */
const REFRESH_PATH = "/api/v1/auth/refresh";
const LOGOUT_PATH = "/api/v1/auth/logout";

/** Matches the value the API requires; forces a CORS preflight so only allowed origins can call. */
export const REQUESTED_WITH = "fintech-app";

type AuthEnvelope = {
  data: { token?: string; role?: string; expiresAt?: string } | null;
  error: { code: string } | null;
};

let inFlight: Promise<string | null> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers share one
 * request, so a burst of 401s cannot trigger a burst of rotations.
 */
export function refreshSession(): Promise<string | null> {
  if (!inFlight) {
    inFlight = runRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runRefresh(): Promise<string | null> {
  const { useSession } = await import("@/stores/session.store");
  let res: Response;
  let json: AuthEnvelope;
  try {
    res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": REQUESTED_WITH },
    });
    json = (await res.json()) as AuthEnvelope;
  } catch {
    // Offline or unreachable API: keep whatever session we have and let the caller retry.
    useSession.getState().setBootstrapped();
    return null;
  }
  const data = json.data;
  if (!res.ok || json.error || !data?.token) {
    useSession.getState().clear();
    return null;
  }
  useSession.getState().setToken(data.token, data.role ?? "", data.expiresAt ?? "");
  return data.token;
}

/** Best-effort server-side revocation. The local session is cleared either way. */
export async function logoutSession(): Promise<void> {
  const { useSession } = await import("@/stores/session.store");
  const token = useSession.getState().token;
  try {
    const headers: Record<string, string> = { "X-Requested-With": REQUESTED_WITH };
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${API_BASE}${LOGOUT_PATH}`, { method: "POST", credentials: "include", headers });
  } catch {
    /* revoking is best effort; the cookie and token are discarded below regardless */
  }
  useSession.getState().clear();
}
