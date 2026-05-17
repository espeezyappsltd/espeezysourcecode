import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Local Server',
  description: 'Developer launchpad with docs, tutorials, and links to local monorepo apps.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
