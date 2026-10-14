import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained `.next/standalone` build (only the files a
  // production server actually needs) — keeps the Docker runtime image
  // small instead of shipping the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
