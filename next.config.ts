/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: 'src/worker/index.ts',
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  // Disable Serwist in development to avoid Turbopack issues
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(withNextIntl(nextConfig));
