import confetti from 'canvas-confetti'
import type { OnboardingCompletionResult } from '@/lib/onboarding/onboarding-service'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export function celebrateOnboardingComplete(result: OnboardingCompletionResult) {
  if (!result.rewardGranted) return

  const fire = (opts: confetti.Options) =>
    confetti({
      particleCount: 48,
      spread: 100,
      ticks: 90,
      zIndex: 9999,
      colors: COLORS,
      ...opts,
    })

  fire({ origin: { x: 0.2, y: 0.65 } })
  fire({ origin: { x: 0.8, y: 0.65 } })
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 180,
      startVelocity: 55,
      origin: { x: 0.5, y: 0.15 },
      colors: COLORS,
      zIndex: 9999,
    })
  }, 200)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('espeezy-onboarding-complete', { detail: result }),
    )
    window.dispatchEvent(new CustomEvent('espeezy-credits-refresh'))
  }
}
