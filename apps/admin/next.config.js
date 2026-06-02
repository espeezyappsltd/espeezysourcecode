const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/fund', destination: '/upgrade', permanent: true },
      { source: '/fund/:path*', destination: '/upgrade', permanent: true },
      { source: '/donation/:path*', destination: '/upgrade', permanent: true },
      // Legacy staff entry points → panel login / console
      { source: '/admin-login', destination: '/login', permanent: false },
      { source: '/staff', destination: '/login', permanent: false },
      { source: '/dashboard', destination: '/admin', permanent: false },
    ]
  },
  // Deployed to Cloudflare Workers (OpenNext) — server mode (no static export)
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  // Removed unsupported 'turbo' key from experimental
}

module.exports = nextConfig
