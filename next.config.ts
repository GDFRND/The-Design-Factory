import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. A stray package-lock.json in the home
  // directory otherwise makes Turbopack infer the wrong root and warn.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
