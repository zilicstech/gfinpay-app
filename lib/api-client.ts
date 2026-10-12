import { API_BASE } from "@/lib/api-base";
import { useLoader } from "@/stores/loader.store";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  retriable: boolean;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiError | null;
  meta: { requestId?: string | null; idempotencyReplay?: boolean | null } | null;
};

const BASE = API_BASE;

/** Keep the global loader up until this path is the current page. */
export function openDetails(path: string, push: (href: string) => void) {
  useLoader.getState().expectPath(path);
  push(path);
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: ApiError,
  ) {
    super(formatErrorMessage(error));
  }
}

export function formatApiError(err: unknown, fallback: string) {
  if (err instanceof ApiClientError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function isAuthFailure(status: number, code: string | undefined) {
  return status === 401 && (code === "UNAUTHENTICATED" || code === "SESSION_EXPIRED");
}

/**
 * Tries to rotate the refresh cookie into a new access token. Returns the token when the
 * caller should retry, or null once the session is genuinely gone.
 */
async function recoverSession(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { refreshSession } = await import("@/lib/auth-client");
  return refreshSession();
}

/** Last resort when refresh fails: drop the session and send the user to the public home page. */
async function abandonSession() {
  if (typeof window === "undefined") return;
  const { useSession, HOME_PATH } = await import("@/stores/session.store");
  useSession.getState().clear();
  if (window.location.pathname !== HOME_PATH) {
    window.location.assign(HOME_PATH);
  }
}

function formatErrorMessage(error: ApiError) {
  if (error.details && typeof error.details === "object") {
    const fields = Object.values(error.details as Record<string, unknown>)
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    if (fields.length) return fields.join(". ");
  }
  return error.message;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; idempotencyKey?: string; agentId?: string; holdLoader?: boolean } = {},
): Promise<T> {
  const { begin, end } = useLoader.getState();
  const { holdLoader, token, idempotencyKey, agentId, ...init } = options;
  begin();
  let held = false;
  try {
    const send = async (bearer: string | null | undefined) => {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
      if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
      if (agentId) headers.set("X-Agent-Id", agentId);
      // Login sets the httpOnly refresh cookie. A cross-origin call (UI on :3001, API on
      // :8090) drops Set-Cookie unless the request opts into credentials.
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers,
        credentials: path.startsWith("/api/v1/auth/") ? "include" : init.credentials,
      });
      return { res, json: (await res.json()) as ApiEnvelope<T> };
    };

    let { res, json } = await send(token);
    if (token && json.error && isAuthFailure(res.status, json.error.code)) {
      const refreshed = await recoverSession();
      if (refreshed) {
        ({ res, json } = await send(refreshed));
      }
    }
    if (!res.ok || json.error) {
      const err = json.error ?? { code: "HTTP_ERROR", message: `Request failed (${res.status})`, retriable: res.status >= 500 };
      if (isAuthFailure(res.status, err.code)) {
        await abandonSession();
      }
      throw new ApiClientError(res.status, err);
    }
    held = holdLoader === true;
    return json.data as T;
  } finally {
    if (!held) end();
  }
}

export async function apiForm<T>(
  path: string,
  form: FormData,
  options: { token?: string | null; holdLoader?: boolean } = {},
): Promise<T> {
  const { begin, end } = useLoader.getState();
  begin();
  let held = false;
  try {
    const send = async (bearer: string | null | undefined) => {
      const headers = new Headers();
      if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
      const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form });
      return { res, json: (await res.json()) as ApiEnvelope<T> };
    };

    let { res, json } = await send(options.token);
    if (options.token && json.error && isAuthFailure(res.status, json.error.code)) {
      const refreshed = await recoverSession();
      if (refreshed) {
        ({ res, json } = await send(refreshed));
      }
    }
    if (!res.ok || json.error) {
      const err = json.error ?? { code: "HTTP_ERROR", message: `Request failed (${res.status})`, retriable: res.status >= 500 };
      if (isAuthFailure(res.status, err.code)) {
        await abandonSession();
      }
      throw new ApiClientError(res.status, err);
    }
    held = options.holdLoader === true;
    return json.data as T;
  } finally {
    if (!held) end();
  }
}
