import type { NextConfig } from 'next'
import path from 'node:path'

const appRoot = path.join(process.cwd())

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: appRoot,
  experimental: {
  },
}

export default nextConfig
