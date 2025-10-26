import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Initialize plugins
const withNextIntl = createNextIntlPlugin();

// Initialize PWA plugin
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Base Next.js configuration
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Merge order: wrap one plugin inside the other
export default withPWA(withNextIntl(nextConfig));
