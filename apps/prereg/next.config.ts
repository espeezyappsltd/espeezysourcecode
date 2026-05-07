import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Deployed to Vercel — server mode (no static export)
  images: {
    unoptimized: true,
  },
}

export default nextConfig
