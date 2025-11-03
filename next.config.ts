/* eslint-disable @typescript-eslint/no-explicit-any */
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const withSerwist = withSerwistInit({
  swSrc: "worker/index.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
    turbopack: {}, // Add this line

};

export default withSerwist(withNextIntl(nextConfig));
