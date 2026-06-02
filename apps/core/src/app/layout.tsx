import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Dev Launch — developer launchpad',
  description:
    'Developer launchpad with documentation, tutorials, and links to local Espeezy monorepo applications.',
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
