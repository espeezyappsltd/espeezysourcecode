import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@/features/home/kanban-home.css'
import PreregFooter from '@/components/PreregFooter'
import { AccessibilityProvider } from '@/features/home/AccessibilityProvider'
import { AccessibilityToolbar } from '@/features/home/AccessibilityToolbar'
import { UserGuide } from '@/features/home/UserGuide'

export const metadata: Metadata = {
  title: 'Espeezy Kanban — Dashboard Home',
  description: 'Welcome to your Kanban workspace. Boards, teams, accessibility tools, and the full user guide.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    other: [{ rel: 'mask-icon', url: '/icon.svg', color: '#10b981' }],
  },
  keywords: ['kanban', 'dashboard', 'task management', 'collaboration', 'students', 'accessibility'],
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Espeezy Kanban — Dashboard Home',
    description: 'Your academic Kanban command center with accessibility tools and a complete user guide.',
    url: 'https://kanban.espeezy.com',
    siteName: 'Espeezy Kanban',
    type: 'website',
    images: [{ url: '/icon.svg', width: 64, height: 64, alt: 'Espeezy Kanban' }],
  },
  twitter: {
    card: 'summary',
    title: 'Espeezy Kanban Home',
    description: 'Visual task management for students and teams.',
    creator: '@espeezy',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          {children}
          <AccessibilityToolbar />
          <UserGuide />
        </AccessibilityProvider>
        <PreregFooter />
      </body>
    </html>
  )
}
