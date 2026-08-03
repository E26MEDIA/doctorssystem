import { NextResponse, type NextRequest } from "next/server";

function buildSecurityHeaders(isConsult: boolean): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": isConsult
      ? "camera=(self), microphone=(self), geolocation=(), payment=(self)"
      : "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      isConsult
        ? "frame-src 'self' https://meet.google.com https://*.google.com"
        : "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isConsult = request.nextUrl.pathname.startsWith("/consult");

  for (const [key, value] of Object.entries(buildSecurityHeaders(isConsult))) {
    response.headers.set(key, value);
  }

  // Never cache authenticated admin API responses
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
