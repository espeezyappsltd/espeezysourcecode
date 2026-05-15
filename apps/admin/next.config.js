const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  experimental: {
    turbo: {
      root: monorepoRoot,
    },
  },
}

module.exports = nextConfig
