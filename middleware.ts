import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["gfp_hint", "gfp_rt"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/admin/login/")) {
    return NextResponse.next();
  }
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.get(name)?.value);
  if (signedIn) {
    return NextResponse.next();
  }
  const login = path.startsWith("/admin") ? "/admin/login" : "/login";
  return NextResponse.redirect(new URL(login, request.url));
}

export const config = {
  matcher: ["/agent/:path*", "/admin/:path*", "/distributor/:path*"],
};
