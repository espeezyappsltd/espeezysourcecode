'use client'

import { LIFECYCLE_STEPS, lifecycleStepIndex } from '@/lib/hustle/gig-ux'

type Props = {
  status: string
  compact?: boolean
}

export function HustleLifecycleBar({ status, compact }: Props) {
  if (status === 'cancelled' || status === 'disputed') {
    return (
      <p className="hustle-lifecycle-cancelled" role="status">
        {status === 'disputed' ? 'This gig is in dispute' : 'This gig was cancelled'}
      </p>
    )
  }

  const activeIdx = lifecycleStepIndex(status)

  return (
    <ol className={`hustle-lifecycle${compact ? ' hustle-lifecycle--compact' : ''}`} aria-label="Gig progress">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = i < activeIdx
        const current = i === activeIdx
        return (
          <li
            key={step.key}
            className={`hustle-lifecycle__step${done ? ' hustle-lifecycle__step--done' : ''}${current ? ' hustle-lifecycle__step--current' : ''}`}
          >
            <span className="hustle-lifecycle__dot" aria-hidden />
            <span className="hustle-lifecycle__label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
