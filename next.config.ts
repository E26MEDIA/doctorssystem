import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  // Keep the build-time SQLite file available to serverless functions on Vercel
  outputFileTracingIncludes: {
    "/**": ["./prod.db"],
  },
};

export default nextConfig;
