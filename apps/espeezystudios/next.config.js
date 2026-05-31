const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo: trace from repo root when hoisted; Vercel app-root installs still resolve this path.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'espeezy.com' },
      { protocol: 'https', hostname: 'yourdomain.com' },
    ],
  },
}

module.exports = nextConfig
