import type { NextConfig } from 'next'
import path from 'node:path'

import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../../')

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    qualities: [20, 40, 50, 60, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      '@shared/assets': path.resolve(monorepoRoot, 'apps/shared/assets/index.ts'),
    },
  },
}

export default nextConfig
