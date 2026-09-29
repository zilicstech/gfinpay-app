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

async function handleUnauthorized(status: number, code: string | undefined) {
  if (status !== 401 || code !== "UNAUTHENTICATED") return;
  if (typeof window === "undefined") return;
  const { useSession } = await import("@/stores/session.store");
  useSession.getState().clear();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
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
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
    if (agentId) headers.set("X-Agent-Id", agentId);

    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    const json = (await res.json()) as ApiEnvelope<T>;
    if (!res.ok || json.error) {
      const err = json.error ?? { code: "HTTP_ERROR", message: `Request failed (${res.status})`, retriable: res.status >= 500 };
      await handleUnauthorized(res.status, err.code);
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
    const headers = new Headers();
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form });
    const json = (await res.json()) as ApiEnvelope<T>;
    if (!res.ok || json.error) {
      const err = json.error ?? { code: "HTTP_ERROR", message: `Request failed (${res.status})`, retriable: res.status >= 500 };
      await handleUnauthorized(res.status, err.code);
      throw new ApiClientError(res.status, err);
    }
    held = options.holdLoader === true;
    return json.data as T;
  } finally {
    if (!held) end();
  }
}
