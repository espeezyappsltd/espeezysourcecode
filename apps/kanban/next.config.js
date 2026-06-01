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
      // Legacy secondary features → core app (removed from Kanban v1 CF bundle)
      { source: '/studio', destination: '/', permanent: false },
      { source: '/studio/:path*', destination: '/', permanent: false },
      { source: '/marketplace', destination: '/', permanent: false },
      { source: '/marketplace/:path*', destination: '/', permanent: false },
      { source: '/marketplace2', destination: '/', permanent: false },
      { source: '/marketplace2/:path*', destination: '/', permanent: false },
      { source: '/assets', destination: '/', permanent: false },
      { source: '/assets/:path*', destination: '/', permanent: false },
      { source: '/games', destination: '/', permanent: false },
      { source: '/games/:path*', destination: '/', permanent: false },
      { source: '/chillout', destination: '/', permanent: false },
      { source: '/chillout/:path*', destination: '/', permanent: false },
      { source: '/jukebox', destination: '/', permanent: false },
      { source: '/ask', destination: '/', permanent: false },
      { source: '/docs', destination: '/', permanent: false },
      { source: '/docs/:path*', destination: '/', permanent: false },
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
