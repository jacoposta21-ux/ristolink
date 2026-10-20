import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modello di caching "classico" (unstable_cache + ISR + revalidateTag):
  // le pagine dei siti sono statiche e invalidate al salvataggio/cambio stato.
  cacheComponents: false,
  poweredByHeader: false,
  // i siti HTML personalizzati arrivano fino a 2 MB (vedi MAX_HTML_BYTES)
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
