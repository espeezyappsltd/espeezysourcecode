'use client'

import type { ProcessResource } from './types'

type Props = {
  resources?: ProcessResource
  accent?: string
  compact?: boolean
}

function formatCpu(cpu: number | null | undefined): string {
  if (cpu == null) return '—'
  return `${cpu}%`
}

function formatMem(mb: number | null | undefined): string {
  if (mb == null) return '—'
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function ResourceMeter({ resources, accent = '#34d399', compact }: Props) {
  if (!resources) {
    return compact ? null : <span className="dev-hub-resource dev-hub-resource--idle">No metrics</span>
  }

  const memPct = resources.memoryMb != null ? Math.min(100, (resources.memoryMb / 2048) * 100) : 0
  const cpuPct = resources.cpuPercent != null ? Math.min(100, resources.cpuPercent) : 0

  return (
    <div className={`dev-hub-resource ${compact ? 'dev-hub-resource--compact' : ''}`}>
      <div className="dev-hub-resource-row">
        <span className="dev-hub-resource-label">RAM</span>
        <span className="dev-hub-resource-value">{formatMem(resources.memoryMb)}</span>
      </div>
      <div className="dev-hub-resource-bar" aria-hidden>
        <span className="dev-hub-resource-fill" style={{ width: `${memPct}%`, background: accent }} />
      </div>
      <div className="dev-hub-resource-row">
        <span className="dev-hub-resource-label">CPU</span>
        <span className="dev-hub-resource-value">{formatCpu(resources.cpuPercent)}</span>
      </div>
      <div className="dev-hub-resource-bar" aria-hidden>
        <span
          className="dev-hub-resource-fill dev-hub-resource-fill--cpu"
          style={{ width: `${cpuPct}%`, background: accent }}
        />
      </div>
    </div>
  )
}
