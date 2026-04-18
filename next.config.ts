import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.124.6", "localhost"],
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: configDir,
  },
};

export default nextConfig;
