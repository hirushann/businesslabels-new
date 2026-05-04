import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "businesslabels.test",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    // Custom loader to handle query strings in local image paths
    loader: undefined, // Use default loader
    // Allow query strings by not optimizing images with query params
    unoptimized: false,
    // Allow local patterns with query strings
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
