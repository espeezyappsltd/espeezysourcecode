import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@shared/theme-cycle.css'
import '@shared/espeezy-appearance.css'
import { GamesThemeProvider } from '@/components/theme/GamesThemeProvider'
import { getGamesLayoutTheme } from '@/lib/layout-theme'
import metadataJson from '@/data/metadata.json'

export const metadata: Metadata = metadataJson as Metadata

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { initialTheme, userPlan } = await getGamesLayoutTheme()

  return (
    <html lang="en">
      <body>
        <GamesThemeProvider initialTheme={initialTheme} userPlan={userPlan}>
          {children}
        </GamesThemeProvider>
      </body>
    </html>
  )
}
