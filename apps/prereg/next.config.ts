import type { NextConfig } from 'next'
import path from 'node:path'

const appRoot = path.join(/* turbopackIgnore: true */ process.cwd())

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
}

export default nextConfig
