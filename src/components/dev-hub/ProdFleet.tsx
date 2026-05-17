'use client'

import { ArrowUpRight, Globe, Radio } from 'lucide-react'
import type { ProdFleetRow } from './types'

function formatLatency(ms: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function ProdFleet({ fleet }: { fleet: ProdFleetRow[] }) {
  if (fleet.length === 0) return null

  const onlineCount = fleet.filter((f) => f.online).length

  return (
    <section className="dev-hub-section" aria-label="Production deployments">
      <div className="dev-hub-section-head">
        <div className="dev-hub-section-eyebrow">
          <Globe size={12} />
          Production fleet
        </div>
        <h2 className="dev-hub-section-title">Live deployments</h2>
        <p className="dev-hub-section-desc">
          Real-time reachability across Espeezy hosts.{' '}
          <span className="dev-hub-section-stat">
            {onlineCount}/{fleet.length} online
          </span>
        </p>
      </div>

      <div className="dev-hub-prod-grid">
        {fleet.map((dep, i) => (
          <article
            key={dep.id}
            className={`dev-hub-prod-card control-card-entrance ${dep.online ? 'dev-hub-prod-card--live' : 'dev-hub-prod-card--down'}`}
            style={{ animationDelay: `${i * 0.05}s`, '--prod-accent': dep.accent } as React.CSSProperties}
          >
            <a href={dep.url} target="_blank" rel="noreferrer" className="dev-hub-prod-card-link">
              <div className="dev-hub-prod-card-top">
                <span
                  className={`dev-hub-prod-status ${dep.online ? 'dev-hub-prod-status--live' : 'dev-hub-prod-status--down'}`}
                  aria-label={dep.online ? 'Online' : 'Unreachable'}
                >
                  <Radio size={10} />
                  {dep.online ? 'Live' : 'Unreachable'}
                </span>
                <ArrowUpRight size={16} className="dev-hub-prod-arrow" />
              </div>

              <h3 className="dev-hub-prod-name">{dep.name}</h3>
              <p className="dev-hub-prod-host">{dep.hostname}</p>
              <p className="dev-hub-prod-tagline">{dep.tagline}</p>

              <div className="dev-hub-prod-footer">
                <span className="dev-hub-prod-metric">
                  {dep.statusCode != null ? `HTTP ${dep.statusCode}` : 'No response'}
                </span>
                <span className="dev-hub-prod-metric dev-hub-prod-metric--accent">
                  {formatLatency(dep.latencyMs)}
                </span>
              </div>
            </a>

            {dep.registerUrl && (
              <a
                href={dep.registerUrl}
                target="_blank"
                rel="noreferrer"
                className="dev-hub-prod-register"
                onClick={(e) => e.stopPropagation()}
              >
                Register form
                <span className="dev-hub-prod-register-path">/#register</span>
                <ArrowUpRight size={12} />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
