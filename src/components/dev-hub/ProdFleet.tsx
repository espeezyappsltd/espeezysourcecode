'use client'

import { ArrowUpRight, Globe, Radio, Timer } from 'lucide-react'
import { averageLatencyMs, formatLatencyMs, latencyBarRatio } from '@/lib/dev-hub/format-latency'
import type { ProdFleetRow } from './types'

function sortFleet(fleet: ProdFleetRow[]): ProdFleetRow[] {
  return [...fleet].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1
    const la = a.latencyMs ?? Number.POSITIVE_INFINITY
    const lb = b.latencyMs ?? Number.POSITIVE_INFINITY
    return la - lb
  })
}

export function ProdFleet({ fleet }: { fleet: ProdFleetRow[] }) {
  if (fleet.length === 0) return null

  const sorted = sortFleet(fleet)
  const onlineCount = fleet.filter((f) => f.online).length
  const avgMs = averageLatencyMs(fleet)
  const lastChecked = Math.max(...fleet.map((f) => f.checkedAt ?? 0))

  return (
    <section id="production" className="dev-hub-section" aria-label="Production deployments">
      <div className="dev-hub-section-head dev-hub-prod-head">
        <div className="dev-hub-prod-head-row">
          <div>
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
          <div className="dev-hub-prod-summary-chips" aria-label="Fleet latency summary">
            {avgMs != null && (
              <span className="dev-hub-prod-chip dev-hub-prod-chip--accent">
                <Timer size={14} aria-hidden />
                Avg {formatLatencyMs(avgMs)}
              </span>
            )}
            {lastChecked > 0 && (
              <span className="dev-hub-prod-chip">
                Checked {new Date(lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="dev-hub-prod-grid">
        {sorted.map((dep, i) => {
          const bar = latencyBarRatio(dep.latencyMs)
          return (
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

                <div
                  className="dev-hub-prod-latency-bar"
                  role="presentation"
                  aria-hidden
                >
                  <span
                    className="dev-hub-prod-latency-bar-fill"
                    style={{ width: `${Math.round(bar * 100)}%` }}
                  />
                </div>

                <div className="dev-hub-prod-footer">
                  <div className="dev-hub-prod-metric-block">
                    <span className="dev-hub-prod-metric-label">Status</span>
                    <span className="dev-hub-prod-metric-value">
                      {dep.statusCode != null ? `HTTP ${dep.statusCode}` : 'No response'}
                    </span>
                  </div>
                  <div className="dev-hub-prod-metric-block dev-hub-prod-metric-block--accent">
                    <span className="dev-hub-prod-metric-label">Latency</span>
                    <span className="dev-hub-prod-metric-value dev-hub-prod-metric-value--latency">
                      {formatLatencyMs(dep.latencyMs)}
                    </span>
                  </div>
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
          )
        })}
      </div>
    </section>
  )
}
