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
  // Avoid noisy middleware deprecation path issues in local preview.
  poweredByHeader: false,
};

export default nextConfig;
