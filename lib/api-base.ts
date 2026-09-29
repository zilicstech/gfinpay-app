/**
 * Origin the browser calls. Empty means same-origin (`/api/...` on this app's domain).
 * The Next.js route at `app/api/[...path]` proxies that path to `API_PROXY_TARGET`.
 * Set `NEXT_PUBLIC_API_BASE_URL` only when the browser should call the API host directly.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
