'use client'

import { useState, useEffect } from 'react'
import OnboardingModal from './OnboardingModal'
import { OnboardingWrapperProps } from '@/types/ui'
import { useProfile } from '@/context/ProfileContext'

export default function OnboardingWrapper({ user, profile: initialProfile, children }: OnboardingWrapperProps) {
  const { profile: contextProfile } = useProfile()
  const profile = contextProfile || initialProfile
  
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!profile?.full_name || !profile?.avatar_url) {
      setShowOnboarding(true)
    }
  }, [profile])

  if (!mounted) {
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
