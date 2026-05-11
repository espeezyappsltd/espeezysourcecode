import type { Metadata, Viewport } from 'next'
import './globals.css'
import PreregFooter from '@/components/PreregFooter'

export const metadata: Metadata = {
  title: 'Espeezy Kanban Workspace',
  description: 'Espeezy-branded visual task management for students and teams.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#10b981' },
    ],
  },
  keywords: ['kanban', 'task management', 'collaboration', 'projects', 'students'],
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Espeezy Kanban Workspace',
    description: 'Espeezy-branded visual task management for academic teams.',
    url: 'https://kanban.espeezy.com',
    siteName: 'Espeezy Kanban',
    type: 'website',
    images: [{ url: '/icon.svg', width: 64, height: 64, alt: 'Espeezy Kanban' }],
  },
  twitter: {
    card: 'summary',
    title: 'Espeezy Kanban',
    description: 'Visual task management for students and teams.',
    creator: '@espeezy',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PreregFooter />
      </body>
    </html>
  )
}
