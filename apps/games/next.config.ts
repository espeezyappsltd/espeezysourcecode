import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../prereg/src'),
    },
  },
}

export default nextConfig
