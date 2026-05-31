import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationProgress from '@/components/NavigationProgress'
import PreregFooter from '@/components/PreregFooter'
import { CentralLoadingProvider } from '@shared/CentralLoadingProvider'
import PageTransitionWrapper from '@shared/PageTransitionWrapper'
import { PLATFORM_ONE_LINER } from '@shared/platform-brand'

const OG_TITLE = 'Espeezy — collaborative workspace for academic teams'

export const metadata: Metadata = {
  metadataBase: new URL('https://espeezy.com'),
  title: 'Espeezy — collaborative workspace for academic teams',
  description: PLATFORM_ONE_LINER,
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#6366f1' },
    ],
  },
  keywords: ['group projects', 'students', 'kanban', 'collaboration', 'contribution tracking', 'education'],
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
  robots: { index: true, follow: true },
  openGraph: {
    title: OG_TITLE,
    description: PLATFORM_ONE_LINER,
    url: 'https://espeezy.com',
    siteName: 'Espeezy',
    type: 'website',
    images: [{ url: '/icon.svg', width: 64, height: 64, alt: 'Espeezy' }],
  },
  twitter: {
    card: 'summary',
    title: OG_TITLE,
    description: PLATFORM_ONE_LINER,
    creator: '@espeezy',
  },
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
      <head>
        <link 
          rel="preload" 
          href="/espeezy-app-mark.svg" 
          as="image" 
          type="image/svg+xml" 
        />
      </head>
      <body>
        <CentralLoadingProvider>
          <NavigationProgress />
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
          <PreregFooter />
        </CentralLoadingProvider>
      </body>
    </html>
  )
}
