import { NextResponse, type NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

function buildCsp() {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com https://platform.instagram.com",
    "style-src 'self' 'unsafe-inline' https://www.instagram.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: http: ws: wss:",
    "frame-src 'self' https://www.instagram.com https://instagram.com https://www.facebook.com",
    "child-src 'self' https://www.instagram.com https://instagram.com https://www.facebook.com",
    "media-src 'self' https: blob:",
    // Soften in non-prod so Cursor / iframe previews can load the site
    isProd ? "frame-ancestors 'none'" : "frame-ancestors *",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  // upgrade-insecure-requests breaks http://localhost and http tunnels
  if (isProd) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), fullscreen=(self \"https://www.instagram.com\")",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Content-Security-Policy": buildCsp(),
};

if (isProd) {
  securityHeaders["X-Frame-Options"] = "DENY";
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(securityHeaders)) {
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
