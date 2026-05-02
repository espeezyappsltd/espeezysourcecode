'use client'

import { ReactNode, useState } from 'react'
import OnboardingModal from './OnboardingModal'
import { OnboardingWrapperProps } from '@/types/ui'
import { useProfile } from '@/context/ProfileContext'

export default function OnboardingWrapper({ user, children }: OnboardingWrapperProps) {
  const { profile } = useProfile()
  const [showOnboarding, setShowOnboarding] = useState(!profile?.full_name || !profile?.avatar_url)

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
