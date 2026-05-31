const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Turbopack scoped to this app so it does not pick up ../../src/proxy.ts (dev hub).
  turbopack: {
    root: path.join(__dirname),
  },
  // Monorepo: trace from repo root when hoisted; Cloudflare builds still resolve this path.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'espeezy.com' },
      { protocol: 'https', hostname: 'yourdomain.com' },
    ],
  },
}

module.exports = nextConfig
