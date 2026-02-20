import type { NextConfig } from 'next'

const isStatic = process.env.NEXT_STATIC_EXPORT === 'true'

/** Security headers applied to every response (Vercel / `next start`). */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStatic ? 'export' : undefined,
  basePath: isStatic ? '/nordcup-map' : '',
  assetPrefix: isStatic ? '/nordcup-map' : '',
  images: { unoptimized: isStatic },
  poweredByHeader: false,

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
