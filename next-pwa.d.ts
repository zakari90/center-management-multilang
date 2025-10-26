declare module '@ducanh2912/next-pwa' {
  import { NextConfig } from 'next'
  
  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    reloadOnOnline?: boolean
    cacheOnFrontEndNav?: boolean
    aggressiveFrontEndNavCaching?: boolean
    swcMinify?: boolean
    workboxOptions?: {
      disableDevLogs?: boolean
    }
  }
  
  export default function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
}
