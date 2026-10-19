// FILE: next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 is compiled through the Turbopack CSS loader (Next 16 default bundler).
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
