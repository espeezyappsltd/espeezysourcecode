import type { NextConfig } from 'next'
import path from 'node:path'

const monorepoRoot = path.join(process.cwd(), '../../')

const nextConfig: NextConfig = {
  // Deployed to Vercel - server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  experimental: {
  },
}

export default nextConfig
