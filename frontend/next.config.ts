import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the on-screen Next.js logo / route indicator shown during development.
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "planner5d.com" },
      { protocol: "https", hostname: "cdn.apartmenttherapy.info" },
      { protocol: "https", hostname: "chandelierslife.com" },
      { protocol: "https", hostname: "web-japan.org" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "ahouseinthehills.com" },
      { protocol: "https", hostname: "cdn.decorilla.com" },
      { protocol: "https", hostname: "mobilious.com" },
      { protocol: "https", hostname: "archipro.com.au" },
    ],
  },
};

export default nextConfig;
