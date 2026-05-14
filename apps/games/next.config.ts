import type { NextConfig } from 'next'
import path from 'path'

const monorepoRoot = path.join(process.cwd(), '../../')

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      '@shared': path.resolve(process.cwd(), '../prereg/src'),
    },
  },
}

export default nextConfig
