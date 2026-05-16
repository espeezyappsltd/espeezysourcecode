import type { NextConfig } from 'next'
import path from 'node:path'

const monorepoRoot = path.join(process.cwd(), '../../')

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  // Removed unsupported 'turbopack' key
}

export default nextConfig
