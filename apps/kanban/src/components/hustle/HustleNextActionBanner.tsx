'use client'

import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'
import type { GigNextAction } from '@/lib/hustle/gig-ux'

type Props = {
  action: GigNextAction
}

export function HustleNextActionBanner({ action }: Props) {
  const Icon =
    action.tone === 'action' ? Zap : action.tone === 'done' ? CheckCircle2 : Clock

  return (
    <div
      className={`hustle-next-action hustle-next-action--${action.tone}`}
      role="status"
    >
      <Icon size={16} aria-hidden />
      <span>{action.label}</span>
    </div>
  )
}
