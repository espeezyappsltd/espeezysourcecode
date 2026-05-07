import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',       // Static HTML export — served by Firebase Hosting
  trailingSlash: true,    // Each page becomes /path/index.html (required for static hosting)
  distDir: 'out',
  images: {
    unoptimized: true,    // Required for static export (no Image Optimization API)
  },
}

export default nextConfig
