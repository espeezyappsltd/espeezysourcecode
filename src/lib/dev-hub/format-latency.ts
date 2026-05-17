/** Always format probe latency in milliseconds (never seconds). */
export function formatLatencyMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  return `${Math.round(ms).toLocaleString('en-GB')} ms`
}

export function averageLatencyMs(
  rows: Array<{ online: boolean; latencyMs: number | null }>,
): number | null {
  const samples = rows.filter((r) => r.online && r.latencyMs != null).map((r) => r.latencyMs as number)
  if (samples.length === 0) return null
  return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
}

/** 0–1 for a simple latency bar (caps at 3s). */
export function latencyBarRatio(ms: number | null | undefined): number {
  if (ms == null || !Number.isFinite(ms)) return 0
  return Math.min(1, Math.max(0, ms / 3000))
}
