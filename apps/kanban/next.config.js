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
      { source: '/upgrade', destination: '/pricing', permanent: true },
      { source: '/marketplace', destination: '/studio', permanent: false },
      { source: '/marketplace/:path*', destination: '/studio', permanent: false },
      { source: '/marketplace2', destination: '/studio', permanent: false },
      { source: '/marketplace2/:path*', destination: '/studio', permanent: false },
      { source: '/hustle', destination: '/studio', permanent: false },
      { source: '/hustle/:path*', destination: '/studio', permanent: false },
      { source: '/account/credits', destination: '/studio', permanent: false },
      { source: '/account/credits/:path*', destination: '/studio', permanent: false },
      { source: '/assets/storage', destination: '/assets', permanent: true },
      { source: '/assets/storage/:path*', destination: '/assets', permanent: true },
      { source: '/assets/credits', destination: '/assets', permanent: false },
      { source: '/assets/credits/:path*', destination: '/assets', permanent: false },
      { source: '/assets/marketplace', destination: '/studio', permanent: false },
      { source: '/assets/impact', destination: '/studio', permanent: false },
      { source: '/invoice', destination: '/studio', permanent: false },
      { source: '/invoice/:path*', destination: '/studio', permanent: false },
    ]
  },
  images: {
    unoptimized: true,
  },
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
