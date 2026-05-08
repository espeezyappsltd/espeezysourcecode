import type { NextConfig } from 'next'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../..')

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
}

export default nextConfig
