'use client'

import { useState, useEffect } from 'react'
import OnboardingModal from './OnboardingModal'
import { OnboardingWrapperProps } from '@/types/ui'
import { useProfile } from '@/context/ProfileContext'

export default function OnboardingWrapper({ user, profile: initialProfile, children }: OnboardingWrapperProps) {
  const { profile: contextProfile, loading } = useProfile()
  const profile = contextProfile || initialProfile
  
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading) return

    const isDismissed = localStorage.getItem('espeezy_onboarding_dismissed') === 'true'
    
    if (isDismissed) {
      setShowOnboarding(false)
      return
    }

    if (!profile?.full_name || !profile?.avatar_url) {
      setShowOnboarding(true)
    } else {
      setShowOnboarding(false)
    }
  }, [profile, loading, mounted])

  if (!mounted || (loading && !profile)) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
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
