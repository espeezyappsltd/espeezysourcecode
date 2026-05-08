import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Games: Coming Soon',
  description: 'Game-based learning is coming to Espeezy. Master subjects through competitive skirmishes, ranked leagues, and co-op challenges.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#f59e0b' },
    ],
  },
  keywords: ['games', 'learning', 'education', 'competition', 'students'],
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Espeezy Games: Coming Soon',
    description: 'Compete. Learn. Dominate. Game-based education for the next generation.',
    url: 'https://games.espeezy.com',
    siteName: 'Espeezy Games',
    type: 'website',
    images: [{ url: '/icon.svg', width: 64, height: 64, alt: 'Espeezy Games' }],
  },
  twitter: {
    card: 'summary',
    title: 'Espeezy Games',
    description: 'Game-based learning platform for students.',
    creator: '@espeezy',
  },
}

export const viewport: Viewport = {
  themeColor: '#f59e0b',
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
