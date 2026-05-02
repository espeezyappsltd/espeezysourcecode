import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ['prereg.espeezy.com'],

  // In Next.js 16, outputFileTracingRoot is a top-level property.
  // This prevents "whole project" tracing warnings during the Turbopack build.
  outputFileTracingRoot: path.join(/* turbopackIgnore: true */ process.cwd()),

  // ── Image optimisation ───────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: '*.espeezy.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },

  // ── HTTP response caching ────────────────────────────────────────────────
  // API routes that are safe to cache at the CDN edge
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    const securityHeaders = isProduction
      ? [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ]
      : []
    const routes = [
      {
        source: '/api/health',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=10, stale-while-revalidate=30' }],
      },
      {
        source: '/api/product/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      // Service worker — never cache at CDN so updates propagate immediately
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ]

    if (securityHeaders.length > 0) {
      routes.unshift({
        source: '/(.*)',
        headers: securityHeaders,
      })
    }

    return routes
  },

  typescript: { ignoreBuildErrors: false },
}

export default nextConfig

