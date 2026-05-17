'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Monitor, Play, Square } from 'lucide-react'
import { PortControl } from './PortControl'
import type { DevAppRow, ProdFleetRow } from './types'

type Props = {
  app: DevAppRow
  busy: boolean
  prodStatus?: ProdFleetRow
  style?: React.CSSProperties
  onStart: (port?: number) => void
  onStop: () => void
  onRefresh: () => void
}

export function AppCard({ app, busy, prodStatus, style, onStart, onStop, onRefresh }: Props) {
  const status = app.runtime?.status ?? 'stopped'
  const isRunning = status === 'running' || status === 'starting'
  const [draftPort, setDraftPort] = useState(app.port)

  useEffect(() => {
    setDraftPort(app.port)
  }, [app.port])

  return (
    <article className="dev-hub-app-card control-card-entrance" style={style}>
      <header className="dev-hub-app-head">
        <div className="dev-hub-app-icon" style={{ background: `${app.accent}22`, borderColor: `${app.accent}44` }}>
          <Monitor size={18} style={{ color: app.accent }} />
        </div>
        <div className="dev-hub-app-head-text">
          <h2 className="dev-hub-app-name">{app.name}</h2>
          <p className="dev-hub-app-desc">{app.description}</p>
        </div>
      </header>

      {prodStatus && (
        <a
          href={prodStatus.url}
          target="_blank"
          rel="noreferrer"
          className={`dev-hub-app-prod-link ${prodStatus.online ? 'dev-hub-app-prod-link--live' : ''}`}
        >
          <span className={`dev-hub-prod-dot ${prodStatus.online ? 'dev-hub-prod-dot--live' : ''}`} />
          <span className="dev-hub-app-prod-host">{prodStatus.hostname}</span>
          <span className="dev-hub-app-prod-meta">
            {prodStatus.online ? `${prodStatus.latencyMs ?? '—'}ms` : 'prod offline'}
          </span>
          <ExternalLink size={12} />
        </a>
      )}

      <div className="dev-hub-app-meta">
        <span className={`dev-hub-pill ${isRunning ? 'dev-hub-pill--running' : ''}`}>{status}</span>
        <span className="dev-hub-pill">
          {app.localHost}:{app.port}
        </span>
        {app.healthy && <span className="dev-hub-pill dev-hub-pill--healthy">HTTP OK</span>}
        {app.runtime?.pid && <span className="dev-hub-pill">pid {app.runtime.pid}</span>}
        {app.runtime?.lastError && <span className="dev-hub-pill dev-hub-pill--error">error</span>}
      </div>

      {!isRunning && (
        <PortControl
          appId={app.id}
          port={app.port}
          defaultPort={app.defaultPort}
          localHost={app.localHost}
          compact
          deferApply
          disabled={busy}
          onPortDraft={setDraftPort}
          onApplied={onRefresh}
        />
      )}

      <div className="dev-hub-app-actions">
        {!isRunning ? (
          <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => onStart(draftPort)}>
            <Play size={14} />
            Start
          </button>
        ) : (
          <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={onStop}>
            <Square size={14} />
            Stop
          </button>
        )}
        <Link href={`/dashboard/${app.id}`} className="btn btn-primary btn-sm">
          Workspace
        </Link>
        {app.productionUrl && !prodStatus && (
          <a href={app.productionUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            Prod
          </a>
        )}
      </div>
    </article>
  )
}
