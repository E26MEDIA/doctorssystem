import { NextResponse, type NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * In development, avoid headers that break localhost / IDE Simple Browser:
 * - upgrade-insecure-requests forces https://localhost (no TLS → hangs)
 * - X-Frame-Options: DENY + frame-ancestors 'none' blank out iframe previews
 * - strict CORP/COOP can block proxied local previews
 */
function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    // ws/wss needed for Next.js HMR on localhost
    "connect-src 'self' ws: wss:",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (isProd) {
    directives.push("frame-ancestors 'none'");
    directives.push("upgrade-insecure-requests");
  }
  // Dev: omit frame-ancestors so IDE Simple Browser / about:blank previews work.
  // (`frame-ancestors *` still blocks null-origin parents.)

  return directives.join("; ");
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Content-Security-Policy", buildCsp());

  if (isProd) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
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
