type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
};

export type ApplyStatus = { state: string; active: boolean };
export type ApplyStart = { url: string; encdata: string; method?: string };

function backendOrigin() {
  const configured = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "http://localhost:8090";
  return "";
}

async function callApi<T>(path: string, method: "GET" | "POST"): Promise<{ status: number; body: ApiEnvelope<T> }> {
  const origin = backendOrigin();
  if (!origin) {
    return {
      status: 503,
      body: { data: null, error: { code: "API_PROXY_UNCONFIGURED", message: "This application link is temporarily unavailable" } },
    };
  }
  const res = await fetch(`${origin}${path}`, {
    method,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = { data: null, error: { code: "HTTP_ERROR", message: "Could not open this application link" } };
  }
  return { status: res.status, body };
}

export function lookupApply(token: string) {
  return callApi<ApplyStatus>(`/api/v1/public/apply/${encodeURIComponent(token)}`, "GET");
}

export function startApply(token: string) {
  return callApi<ApplyStart>(`/api/v1/public/apply/${encodeURIComponent(token)}/start`, "POST");
}
