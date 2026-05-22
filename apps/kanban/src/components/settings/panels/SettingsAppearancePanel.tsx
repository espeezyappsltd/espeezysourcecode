'use client'

import { EspeezyAppearanceSettings } from '@shared/EspeezyAppearanceSettings'
import { canAccessPaletteTier } from '@/utils/feature-gate'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsAppearancePanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    addToast,
    getErrorMessage,
    setActiveTab,
    isToasterMode,
    setIsToasterMode,
    customBg,
    setCustomBg,
    uploadingBg,
    handleFileUpload,
  } = vm

  return (
    <EspeezyAppearanceSettings
      subscriptionPlan={profile?.subscription_plan}
      canAccessPalette={(tier) => canAccessPaletteTier(profile, tier)}
      onUpgrade={() => setActiveTab('billing')}
      showLowPowerMode
      isToasterMode={isToasterMode}
      onToasterModeChange={(next) => {
        setIsToasterMode(next)
        addToast(
          'Performance Protocol Updated',
          next ? 'Low Power Mode enabled.' : 'Standard performance restored.',
          'info',
        )
      }}
      showCustomCanvas
      customBg={customBg}
      onCustomBgClear={() => void setCustomBg(null)}
      uploadingBg={uploadingBg}
      onBgFileSelect={(e) => void handleFileUpload(e, 'bg')}
      onPaletteApplied={(name) => {
        addToast('Appearance Synced', `The ${name} palette has been successfully applied to your terminal.`, 'success')
      }}
      onPaletteError={(message) => {
        if (message === 'PREMIUM_LOCKED' || message === 'PRO_LOCKED') {
          addToast('Access Unauthorized', 'This visual protocol requires higher institutional clearance.', 'error')
          setActiveTab('billing')
        } else {
          addToast('Sync Error', message || 'Failed to apply theme.', 'error')
        }
      }}
    />
  )
}
