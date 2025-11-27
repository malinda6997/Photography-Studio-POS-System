import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(request) {
  const token = request.cookies.get("auth-token");
  let user = null;

  if (token) {
    try {
      user = jwt.verify(
        token.value,
        process.env.JWT_SECRET || "fallback-secret"
      );
    } catch {
      // Invalid token
      user = null;
    }
  }

  const { pathname } = request.nextUrl;

  // Allow access to auth pages and public pages
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/_next" ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no user
  if (!user) {
    const loginUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminOnlyRoutes = ["/api/reports", "/api/users", "/reports", "/users"];

  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Frame deletion - admin only
  if (pathname.startsWith("/api/frames") && request.method === "DELETE") {
    if (user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({
          error: "Access denied. Only admins can delete frames.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
