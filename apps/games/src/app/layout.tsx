import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Games: Coming Soon',
  description: 'Game-based learning is coming to Espeezy. Master subjects through competitive skirmishes, ranked leagues, and co-op challenges.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Espeezy Games: Coming Soon',
    description: 'Compete. Learn. Dominate. Game-based education for the next generation.',
    url: 'https://games.espeezy.com',
    siteName: 'Espeezy Games',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
