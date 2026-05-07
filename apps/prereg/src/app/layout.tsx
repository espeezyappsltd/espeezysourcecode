import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/NavigationProgress'

export const metadata: Metadata = {
  title: 'Espeezy — Early Access',
  description: 'Join 5 million students shaping the future of collaborative education.',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  openGraph: {
    title: 'Espeezy — Early Access',
    description: 'The platform that gives every student a fair voice.',
    url: 'https://espeezy.com/preregister',
    siteName: 'Espeezy',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
