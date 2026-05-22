'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { EspeezyAppearanceSettings } from '@shared/EspeezyAppearanceSettings'
import { uploadThemeBackground } from '@shared/upload-theme-background'
import { useTheme } from '@/components/theme/GamesThemeProvider'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useKanbanAppLink } from '@/hooks/useKanbanAppLink'

export default function GamesSettingsPage() {
  const { customBg, setCustomBg } = useTheme()
  const user = useSupabaseUser()
  const [plan, setPlan] = useState<string | null>(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isToasterMode, setIsToasterMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gf_toaster_mode') === 'true'
  })

  const kanbanBillingUrl = useKanbanAppLink('/settings?tab=billing')

  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    void supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPlan(data?.subscription_plan ?? null))
  }, [user])

  useEffect(() => {
    if (isToasterMode) document.body.classList.add('toaster-mode')
    else document.body.classList.remove('toaster-mode')
  }, [isToasterMode])

  const handleBgUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !user) return

      const supabase = getSupabaseClient()
      if (!supabase) {
        setStatusMessage('Sign in to upload a custom backdrop.')
        return
      }

      setUploadingBg(true)
      setStatusMessage(null)
      try {
        const publicUrl = await uploadThemeBackground(supabase, user.id, file)
        await setCustomBg(publicUrl)
        setStatusMessage('Custom backdrop synced across Espeezy apps.')
      } catch {
        setStatusMessage('Upload failed. Try a smaller image or sign in again.')
      } finally {
        setUploadingBg(false)
      }
    },
    [user, setCustomBg],
  )

  return (
    <div className="games-settings-page">
      <nav className="games-settings-nav" aria-label="Games settings">
        <Link href="/" className="games-settings-nav__link">
          ← Back to browse
        </Link>
      </nav>

      <div
        className="games-settings-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

      <EspeezyAppearanceSettings
        subscriptionPlan={plan}
        upgradeHref={kanbanBillingUrl}
        onUpgrade={() => {
          window.location.href = kanbanBillingUrl
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
          setStatusMessage(`Theme applied: ${name}. Synced with Kanban when signed in.`)
        }}
        onPaletteError={(message) => {
          if (message === 'PREMIUM_LOCKED' || message === 'PRO_LOCKED') {
            setStatusMessage('This theme requires a Pro or Premium plan.')
            window.location.href = kanbanBillingUrl
          } else {
            setStatusMessage(message || 'Failed to apply theme.')
          }
        }}
      />
    </div>
  )
}
