'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { EspeezyAppearanceSettings } from '@shared/EspeezyAppearanceSettings'
import { uploadThemeBackground } from '@shared/upload-theme-background'
import { useTheme } from '@/components/theme/StudiosThemeProvider'
import { supabase } from '@/lib/supabase-client'
import StudioPageShell from '@/components/StudioPageShell'

const KANBAN_SETTINGS =
  process.env.NEXT_PUBLIC_KANBAN_URL?.replace(/\/$/, '') || 'https://kanban.espeezy.com'

export default function StudiosSettingsPage() {
  const { customBg, setCustomBg } = useTheme()
  const [plan, setPlan] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isToasterMode, setIsToasterMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gf_toaster_mode') === 'true'
  })

  const billingUrl = `${KANBAN_SETTINGS}/settings?tab=billing`

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      if (!data.user) return
      void supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => setPlan(profile?.subscription_plan ?? null))
    })
  }, [])

  useEffect(() => {
    if (isToasterMode) document.body.classList.add('toaster-mode')
    else document.body.classList.remove('toaster-mode')
  }, [isToasterMode])

  const handleBgUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !userId) return

      setUploadingBg(true)
      setStatusMessage(null)
      try {
        const publicUrl = await uploadThemeBackground(supabase, userId, file)
        await setCustomBg(publicUrl)
        setStatusMessage('Custom backdrop synced across Espeezy apps.')
      } catch {
        setStatusMessage('Upload failed. Sign in and try a smaller image.')
      } finally {
        setUploadingBg(false)
      }
    },
    [userId, setCustomBg],
  )

  return (
    <StudioPageShell
      title="Settings"
      description="Appearance and performance — synced with Kanban and Games when you are signed in."
      wide
    >
      <nav className="studio-settings-nav" aria-label="Settings">
        <Link href="/" className="studio-link">
          ← Back to studio home
        </Link>
        <Link href="/login" className="studio-link">
          Account / sign in
        </Link>
      </nav>

      <div className="studio-settings-status" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <EspeezyAppearanceSettings
        subscriptionPlan={plan}
        upgradeHref={billingUrl}
        onUpgrade={() => {
          window.location.href = billingUrl
        }}
        showLowPowerMode
        isToasterMode={isToasterMode}
        onToasterModeChange={(next) => {
          setIsToasterMode(next)
          setStatusMessage(next ? 'Low Power Mode enabled.' : 'Standard performance restored.')
        }}
        showCustomCanvas
        customBg={customBg}
        onCustomBgClear={() => void setCustomBg(null)}
        uploadingBg={uploadingBg}
        onBgFileSelect={(e) => void handleBgUpload(e)}
        onPaletteApplied={(name) => {
          setStatusMessage(`Theme applied: ${name}. Synced with Kanban & Games.`)
        }}
        onPaletteError={(message) => {
          if (message === 'PREMIUM_LOCKED' || message === 'PRO_LOCKED') {
            setStatusMessage('This theme requires a Pro or Premium plan.')
            window.location.href = billingUrl
          } else {
            setStatusMessage(message || 'Failed to apply theme.')
          }
        }}
      />

      <p className="studio-muted" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
        <Settings size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
        Studio page content (team, projects, KPIs) is editable when signed in as an Espeezy admin.
      </p>
    </StudioPageShell>
  )
}
