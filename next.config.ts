import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files that must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Bookmarklet captures send a trimmed page snapshot through a server action.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
