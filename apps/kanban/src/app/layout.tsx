import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Kanban: Coming Soon',
  description: 'Visual task management built for students and teams. Track coursework, manage group projects, and hit every deadline.',
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
    title: 'Espeezy Kanban: Coming Soon',
    description: 'The smartest academic kanban board is almost here.',
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
  appLinks: [],
}

export const viewport: Viewport = {
  themeColor: '#10b981',
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
