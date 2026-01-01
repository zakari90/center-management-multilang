/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: 'src/worker/index.ts',
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  // Disable Serwist in development to avoid Turbopack issues
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: Also ignore TypeScript errors during builds if needed
    // ignoreBuildErrors: true,
  },
};

export default withSerwist(withNextIntl(nextConfig));
