/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: "worker/index.ts",
  swDest: "public/sw.js",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  disable: false,
  disableDevLogs: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(withNextIntl(nextConfig));
