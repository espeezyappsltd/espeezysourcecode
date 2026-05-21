import type { Metadata, Viewport } from 'next'
import './globals.css'
import metadataJson from '@/data/metadata.json'

export const metadata: Metadata = metadataJson as Metadata

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
