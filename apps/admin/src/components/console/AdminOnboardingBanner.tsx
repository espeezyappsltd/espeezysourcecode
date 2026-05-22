'use client'

import { useAdminOnboarding } from '@/context/AdminOnboardingContext'

export function AdminOnboardingBanner() {
  const { dismissed, currentStep, steps, dismiss, next, pageHint, setPageHint } = useAdminOnboarding()
  if (dismissed) {
    if (!pageHint) return null
    return (
      <div className="admin-console-onboarding" role="note">
        <p>{pageHint}</p>
        <div className="admin-console-onboarding-actions">
          <button type="button" className="admin-console-btn" onClick={() => setPageHint(null)}>
            Got it
          </button>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  if (!step) return null

  return (
    <div className="admin-console-onboarding" role="region" aria-label="Onboarding">
      <div>
        <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
          Step {currentStep + 1} of {steps.length}: {step.title}
        </strong>
        <p>{step.body}</p>
      </div>
      <div className="admin-console-onboarding-actions">
        <button type="button" className="admin-console-btn" onClick={dismiss}>
          Skip
        </button>
        <button type="button" className="admin-console-btn admin-console-btn-primary" onClick={next}>
          {currentStep >= steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
