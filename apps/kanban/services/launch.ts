export async function fetchLaunchConfig() {
  const res = await fetch('/api/launch-config')
  if (!res.ok) return null
  return res.json() as Promise<{ config?: Record<string, unknown> }>
}

export async function fetchLiveMetrics() {
  const res = await fetch('/api/live-metrics', { cache: 'no-store' })
  if (!res.ok) return null
  return res.json() as Promise<Record<string, unknown>>
}