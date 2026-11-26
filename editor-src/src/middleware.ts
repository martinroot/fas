import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.includes("/api/") || pathname.includes("/media/")) return NextResponse.next();
  const loggedIn = Boolean(req.cookies.get("fas_session")?.value);
  if (loggedIn && pathname.endsWith("/login")) return NextResponse.redirect(new URL("/editor", req.url));
  if (!loggedIn) {
    const login = new URL("/editor/login", req.url);
    login.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/editor/:path*"] };
