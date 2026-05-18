'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight, UserCircle } from 'lucide-react'
import type { OnboardingTourAction } from '@/lib/onboarding/dashboard-tasks'

type OnboardingTourButtonProps = {
  action: OnboardingTourAction
  variant?: 'card' | 'modal'
  onNavigate?: () => void
}

export default function OnboardingTourButton({
  action,
  variant = 'modal',
  onNavigate,
}: OnboardingTourButtonProps) {
  const router = useRouter()
  const isPersonal = action.label === 'Personal'

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    onNavigate?.()
    router.push(action.path)
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        className={`kanban-card__tour-btn${isPersonal ? ' kanban-card__tour-btn--personal' : ''}`}
        onClick={handleClick}
        aria-label={`${action.label}: open feature tour`}
        data-testid={`onboarding-tour-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {isPersonal ? <UserCircle size={14} aria-hidden /> : null}
        {action.label}
        <ArrowUpRight size={12} aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`onboarding-tour-btn${isPersonal ? ' onboarding-tour-btn--personal' : ''}`}
      onClick={handleClick}
      data-testid={`onboarding-tour-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {isPersonal ? <UserCircle size={18} aria-hidden /> : <ArrowUpRight size={18} aria-hidden />}
      {isPersonal ? 'Open Personal Arsenal' : action.label}
    </button>
  )
}
