const path = require('path')

const monorepoRoot = path.join(process.cwd(), '../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: 'https://kanban.espeezy.com/',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: 'https://kanban.espeezy.com/:path*',
        permanent: true,
      },
      { source: '/fund', destination: '/pricing', permanent: true },
      { source: '/fund/:path*', destination: '/pricing', permanent: true },
      { source: '/donation/:path*', destination: '/pricing', permanent: true },
    ]
  },
  // Deployed to Vercel — server mode (no static export)
  images: {
    qualities: [20, 40, 50, 60, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  outputFileTracingRoot: monorepoRoot,
  // Removed unsupported 'turbo' key from experimental
}

module.exports = nextConfig
