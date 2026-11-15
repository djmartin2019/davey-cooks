import type { NextConfig } from "next";

// Unique per build. The home-screen app compares it with /version.json to
// notice a new deploy and reload itself (src/components/update-check.tsx).
const buildId = process.env.BUILD_ID ?? new Date().toISOString();

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
  // Static HTML export for Apache hosting (see .claude/CLAUDE.md).
  output: "export",
  // Emit /recipes/slug/index.html so Apache serves clean directory URLs.
  trailingSlash: true,
  images: {
    // The default image optimizer needs a server; recipe photos are
    // pre-optimized WebP files served as-is.
    unoptimized: true,
  },
  // Cache Components / Partial Prefetching enable PPR, which Next.js does not
  // support with `output: "export"`; the whole site is prerendered at build time.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
