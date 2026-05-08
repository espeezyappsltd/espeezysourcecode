import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
}

export default nextConfig
