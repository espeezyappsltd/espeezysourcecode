import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/NavigationProgress'
import PreregFooter from '@/components/PreregFooter'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Espeezy: Early Access',
  description: 'Join 5 million students shaping the future of collaborative education.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#6366f1' },
    ],
  },
  keywords: ['education', 'collaboration', 'students', 'early access', 'learning platform'],
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Espeezy: Early Access',
    description: 'The platform that gives every student a fair voice.',
    url: 'https://espeezy.com/preregister',
    siteName: 'Espeezy',
    type: 'website',
    images: [{ url: '/icon.svg', width: 64, height: 64, alt: 'Espeezy' }],
  },
  twitter: {
    card: 'summary',
    title: 'Espeezy: Early Access',
    description: 'The platform that gives every student a fair voice.',
    creator: '@espeezy',
  },
  appLinks: [],
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationProgress />
        {children}
        <PreregFooter />
        <Analytics />
      </body>
    </html>
  )
}
