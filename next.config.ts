/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: "src/worker/index.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  output: "standalone" as const,
  reactStrictMode: true,
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

export default withSerwist(withNextIntl(nextConfig as any));
