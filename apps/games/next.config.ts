import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../prereg/src'),
    },
  },
}

export default nextConfig
