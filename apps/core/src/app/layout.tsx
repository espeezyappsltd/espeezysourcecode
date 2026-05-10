import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Espeezy Core',
  description: 'Local-first core runtime for the scaled main Espeezy app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
