import type { NextConfig } from "next";

const recoveryResponseHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Packaged runtime bytes are immutable. Next 16.4 promotes route seeds into
  // server/route-cache at runtime unless disk flushing is disabled. Keep its
  // bounded memory cache while preserving ordinary source-build behavior.
  experimental: process.env.AUGNES_PACKAGE_BUILD === "1"
    ? { isrFlushToDisk: false }
    : {},
  async headers() {
    return [
      {
        source: "/recovery",
        headers: recoveryResponseHeaders,
      },
    ];
  },
};

export default nextConfig;
