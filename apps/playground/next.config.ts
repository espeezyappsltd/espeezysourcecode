import type { NextConfig } from 'next'
import path from 'node:path'

const appRoot = path.join(/* turbopackIgnore: true */ process.cwd())

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
}

export default nextConfig
