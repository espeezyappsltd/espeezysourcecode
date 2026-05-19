import confetti from 'canvas-confetti'

const STORAGE_PREFIX = 'gf_completion_celebrated_'
const COLORS = ['#10b981', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff']

/** Task count for which confetti already ran (one celebration per completion instance). */
export function getCelebratedTaskCount(groupId: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${groupId}`)
    if (raw == null) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function markCelebratedForTaskCount(groupId: string, taskCount: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${groupId}`, String(taskCount))
  } catch {
    /* ignore */
  }
}

/** True when at 100% and this task-set completion has not been celebrated yet. */
export function shouldCelebrateCompletion(
  groupId: string,
  taskCount: number,
  progressPercent: number,
): boolean {
  if (taskCount <= 0 || progressPercent < 100) return false
  return getCelebratedTaskCount(groupId) !== taskCount
}

export function celebrateAllTasksComplete(): void {
  if (typeof window === 'undefined') return

  const fire = (opts: confetti.Options) =>
    confetti({
      particleCount: 48,
      spread: 100,
      ticks: 90,
      zIndex: 9999,
      colors: COLORS,
      ...opts,
    })

  fire({ origin: { x: 0.15, y: 0.7 } })
  fire({ origin: { x: 0.85, y: 0.7 } })

  confetti({
    particleCount: 140,
    spread: 180,
    startVelocity: 52,
    origin: { x: 0.5, y: 0.12 },
    colors: COLORS,
    zIndex: 9999,
  })

  const end = Date.now() + 2800
  const interval = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(interval)
      return
    }
    fire({
      particleCount: 28,
      origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() * 0.25 },
    })
    fire({
      particleCount: 28,
      origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() * 0.25 },
    })
  }, 280)
}
