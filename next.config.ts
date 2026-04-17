import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.124.6", "localhost"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
