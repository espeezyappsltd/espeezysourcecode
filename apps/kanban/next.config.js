const path = require('path')

/** Repo root (espeezy monorepo) — required for serverless file tracing. */
const monorepoRoot = path.join(__dirname, '../..')
/** Cross-app UI shared by kanban, games, etc. */
const sharedDir = path.join(__dirname, '../shared')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/fund', destination: '/upgrade', permanent: true },
      { source: '/fund/:path*', destination: '/upgrade', permanent: true },
      { source: '/donation/:path*', destination: '/upgrade', permanent: true },
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
