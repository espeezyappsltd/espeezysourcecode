import { Activity, Cloud, Cpu, Gauge, HardDrive, Server } from 'lucide-react'
import { formatLatencyMs } from '@/lib/dev-hub/format-latency'
import type { HubMetrics } from './types'

export function MetricsBar({ metrics }: { metrics: HubMetrics }) {
  const items = [
    {
      label: 'Prod online',
      value: metrics.prodOnline != null ? `${metrics.prodOnline}/${metrics.prodTotal ?? 0}` : '—',
      color: '#10b981',
      icon: Cloud,
    },
    {
      label: 'Avg latency',
      value: formatLatencyMs(metrics.avgLatencyMs),
      color: '#06b6d4',
      icon: Gauge,
    },
    {
      label: 'Local running',
      value: metrics.running,
      color: '#a78bfa',
      icon: Activity,
    },
    {
      label: 'Fleet RAM',
      value: metrics.totalMemoryMb != null ? `${metrics.totalMemoryMb} MB` : '—',
      color: '#f472b6',
      icon: HardDrive,
    },
    {
      label: 'Fleet CPU',
      value: metrics.avgCpuPercent != null ? `${metrics.avgCpuPercent}%` : '—',
      color: '#fbbf24',
      icon: Cpu,
    },
    {
      label: 'Hub',
      value: `:${metrics.hubPort}`,
      color: '#34d399',
      icon: Server,
    },
  ]

  return (
    <section className="dev-hub-metrics" aria-label="Fleet metrics">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <article
            key={item.label}
            className="dev-hub-metric control-card-entrance"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="dev-hub-metric-icon" style={{ color: item.color }}>
              <Icon size={16} />
            </div>
            <div className="dev-hub-metric-value" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="dev-hub-metric-label">{item.label}</div>
          </article>
        )
      })}
    </section>
  )
}
