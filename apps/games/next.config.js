const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  experimental: {
    turbo: {
      root: monorepoRoot,
      resolveAlias: {
        '@shared': path.resolve(process.cwd(), '../prereg/src'),
      },
    },
  },
}

module.exports = nextConfig
