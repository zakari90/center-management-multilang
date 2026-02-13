/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  output: "standalone" as const,
  reactStrictMode: true,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  turbopack: {
    // resolveAlias: {
    //   canvas: "./empty-module.ts",
    // },
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/custom-sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/workbox-:path(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/swe-worker-:path(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  typescript: {
    // Optional: Also ignore TypeScript errors during builds if needed
    // ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig as any);
