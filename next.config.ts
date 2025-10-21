import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = { eslint: {
    ignoreDuringBuilds: true,
  },};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
