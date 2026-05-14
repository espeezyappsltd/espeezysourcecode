import type { Metadata, Viewport } from 'next'
import './globals.css'
import './prestige.css'

export const metadata: Metadata = {
  title: 'Espeezy Monorepo',
  description: 'Academic infrastructure hub.',
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
