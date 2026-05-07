import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Kanban: Coming Soon',
  description: 'Visual task management built for students and teams. Track coursework, manage group projects, and hit every deadline.',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  openGraph: {
    title: 'Espeezy Kanban: Coming Soon',
    description: 'The smartest academic kanban board is almost here.',
    url: 'https://kanban.espeezy.com',
    siteName: 'Espeezy Kanban',
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
      <body>{children}</body>
    </html>
  )
}
