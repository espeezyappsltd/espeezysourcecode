import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Pre-Registration',
  description: 'Standalone pre-registration app for Espeezy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
