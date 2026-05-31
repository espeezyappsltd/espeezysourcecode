import React from 'react'
import './globals.css'
import '@shared/theme-cycle.css'
import '@shared/espeezy-appearance.css'
import type { Metadata } from 'next'
import GlobalFooter from '../components/GlobalFooter'
import AppsNav from '../components/AppsNav'
import { StudiosThemeProvider } from '@/components/theme/StudiosThemeProvider'
import { getStudiosLayoutTheme } from '@/lib/layout-theme'

export const metadata: Metadata = {
  title: 'Espeezy Studios',
  description: 'Dashboard and management for Espeezy Studios',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { initialTheme, userPlan } = await getStudiosLayoutTheme()

  return (
    <html lang="en">
      <body>
        <StudiosThemeProvider initialTheme={initialTheme} userPlan={userPlan}>
          <AppsNav />
          {children}
          <GlobalFooter />
        </StudiosThemeProvider>
      </body>
    </html>
  )
}
