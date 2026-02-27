import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")
  ) {
    // Redirect logged-in users away from auth pages
    if (session?.user) {
      const role = (session.user as { role: string }).role;
      const redirectUrl = role === "DOCTOR" ? "/doctor" : "/patient";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as { role: string }).role;

  // Role-based access
  if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/patient", req.url));
  }

  if (pathname.startsWith("/patient") && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/doctor", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*", "/login", "/register"],
};
