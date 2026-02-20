import type { NextConfig } from 'next'

const isStatic = process.env.NEXT_STATIC_EXPORT === 'true'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStatic ? 'export' : undefined,
  basePath: isStatic ? '/nordcup-map' : '',
  assetPrefix: isStatic ? '/nordcup-map' : '',
  images: { unoptimized: isStatic },
}

export default nextConfig
