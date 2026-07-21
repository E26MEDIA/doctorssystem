import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prefer local /public images; keep Unsplash allowed as a fallback.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  poweredByHeader: false,
  // Allow IDE / tunnel hosts to load Next.js dev assets (HMR, etc.)
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.trycloudflare.com",
    "*.loca.lt",
  ],
};

export default nextConfig;
