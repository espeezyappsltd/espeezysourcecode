const path = require('path')

/** Repo root (espeezy monorepo) — required for serverless file tracing. */
const monorepoRoot = path.join(__dirname, '../..')
/** Cross-app UI shared by kanban, games, etc. */
const sharedDir = path.join(__dirname, '../shared')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: true },
      { source: '/dashboard/:path*', destination: '/:path*', permanent: true },
      { source: '/fund', destination: '/pricing', permanent: true },
      { source: '/fund/:path*', destination: '/pricing', permanent: true },
      { source: '/donation/:path*', destination: '/pricing', permanent: true },
      // Legacy paths → working destinations
      { source: '/marketplace', destination: '/studio', permanent: false },
      { source: '/marketplace/:path*', destination: '/studio', permanent: false },
      { source: '/marketplace2', destination: '/studio', permanent: false },
      { source: '/marketplace2/:path*', destination: '/studio', permanent: false },
      { source: '/assets', destination: '/settings', permanent: false },
      { source: '/assets/:path*', destination: '/settings', permanent: false },
      { source: '/games', destination: 'https://games.espeezy.com', permanent: false },
      { source: '/games/:path*', destination: 'https://games.espeezy.com/:path*', permanent: false },
      { source: '/chillout', destination: 'https://games.espeezy.com', permanent: false },
      { source: '/chillout/:path*', destination: 'https://games.espeezy.com', permanent: false },
      { source: '/jukebox', destination: 'https://games.espeezy.com', permanent: false },
      { source: '/docs', destination: 'https://espeezy.com/docs', permanent: false },
      { source: '/docs/:path*', destination: 'https://espeezy.com/docs/:path*', permanent: false },
      { source: '/product/:path*', destination: 'https://espeezy.com/docs/features/:path*', permanent: false },
      { source: '/solutions/:path*', destination: 'https://espeezy.com/docs/getting-started', permanent: false },
    ]
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    '/*': ['../shared/**/*'],
  },
  turbopack: {
    resolveAlias: {
      '@shared': sharedDir,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': sharedDir,
    }
    return config
  },
}

module.exports = nextConfig
