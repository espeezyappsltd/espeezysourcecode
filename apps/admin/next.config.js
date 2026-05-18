const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/fund', destination: '/upgrade', permanent: true },
      { source: '/fund/:path*', destination: '/upgrade', permanent: true },
      { source: '/donation/:path*', destination: '/upgrade', permanent: true },
    ]
  },
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: monorepoRoot,
  // Removed unsupported 'turbo' key from experimental
}

module.exports = nextConfig
