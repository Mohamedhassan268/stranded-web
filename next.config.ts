import type { NextConfig } from "next";
const config: NextConfig = {
  // Tests build into their own folder, so they can run beside a dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
