import { useEffect } from 'react'

type UseCheckoutAwarePollingOptions = {
  intervalMs?: number
  burstDelaysMs?: number[]
  markerKey?: string
  maxMarkerAgeMs?: number
}

export function useCheckoutAwarePolling(
  refresh: () => void,
  {
    intervalMs = 15_000,
    burstDelaysMs = [1500, 4000, 8000, 15_000],
    markerKey = 'espeezy_donation_completed_at',
    maxMarkerAgeMs = 10 * 60 * 1000,
  }: UseCheckoutAwarePollingOptions = {},
) {
  useEffect(() => {
    refresh()

    const burstTimers: number[] = []
    const params = new URLSearchParams(window.location.search)
    const completedAtRaw = window.sessionStorage.getItem(markerKey)
    const completedAt = Number(completedAtRaw ?? '0')
    const hasRecentMarker = Number.isFinite(completedAt)
      && completedAt > 0
      && (Date.now() - completedAt) < maxMarkerAgeMs
    const returnedFromCheckout = params.has('session_id')
      || params.has('payment_intent')
      || params.get('donated') === '1'
      || hasRecentMarker

    if (returnedFromCheckout) {
      for (const delayMs of burstDelaysMs) {
        burstTimers.push(window.setTimeout(refresh, delayMs))
      }

      if (hasRecentMarker) {
        window.sessionStorage.removeItem(markerKey)
      }

      if (params.get('donated') === '1') {
        params.delete('donated')
        const nextSearch = params.toString()
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
        window.history.replaceState(null, '', nextUrl)
      }
    }

    const interval = window.setInterval(refresh, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const onOnline = () => refresh()

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      window.clearInterval(interval)
      for (const timer of burstTimers) window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [burstDelaysMs, intervalMs, markerKey, maxMarkerAgeMs, refresh])
}
