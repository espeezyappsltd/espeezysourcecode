'use client'

import { useState, useEffect } from 'react'
import OnboardingModal from './OnboardingModal'
import { OnboardingWrapperProps } from '@/types/ui'
import { useProfile } from '@/context/ProfileContext'
import { isMockDisplayName } from '@/components/onboarding/CyclingNamePlaceholder'

export default function OnboardingWrapper({ user, profile: initialProfile, children }: OnboardingWrapperProps) {
  const { profile: contextProfile } = useProfile()
  const profile = contextProfile || initialProfile

  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const isDismissed = localStorage.getItem('espeezy_onboarding_dismissed') === 'true'
    if (isDismissed) {
      setShowOnboarding(false)
      return
    }

    const needsName = !profile?.full_name || isMockDisplayName(profile.full_name)
    setShowOnboarding(needsName || !profile?.avatar_url)
  }, [profile, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  if (showOnboarding) {
    return (
      <>
        <OnboardingModal user={user} onComplete={() => setShowOnboarding(false)} />
        {children}
      </>
    )
  }

  return <>{children}</>
}
