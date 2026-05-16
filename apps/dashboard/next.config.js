const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  // Removed unsupported 'turbo' key from experimental
}

module.exports = nextConfig
