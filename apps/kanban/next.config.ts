import type { NextConfig } from 'next'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../..')

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../prereg/src'),
    },
  },
}

export default nextConfig
