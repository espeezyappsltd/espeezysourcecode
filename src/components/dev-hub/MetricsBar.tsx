import { Activity, Cloud, Cpu, Gauge, Server } from 'lucide-react'
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
      value: metrics.avgLatencyMs != null ? `${metrics.avgLatencyMs}ms` : '—',
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
      label: 'Local stopped',
      value: metrics.stopped,
      color: 'var(--text-sub)',
      icon: Server,
    },
    {
      label: 'Errors',
      value: metrics.errors,
      color: metrics.errors ? '#ef4444' : 'var(--text-sub)',
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
