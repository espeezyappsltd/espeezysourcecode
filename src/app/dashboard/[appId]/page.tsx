'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, RefreshCw, RotateCcw, Terminal } from 'lucide-react'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
import { PortControl } from '@/components/dev-hub/PortControl'
import { ResizableWorkspace } from '@/components/dev-hub/ResizableWorkspace'
import { usePoll } from '@/components/dev-hub/usePoll'
import { useWorkspaceLayout } from '@/components/dev-hub/useWorkspaceLayout'
import type { DevAppRow, TerminalEntry } from '@/components/dev-hub/types'

export default function AppWorkspacePage() {
  const params = useParams()
  const appId = String(params.appId ?? '')
  const { prefs, setPrefs, resetLayout, hydrated } = useWorkspaceLayout(appId)
  const [app, setApp] = useState<DevAppRow | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [terminalSessions, setTerminalSessions] = useState<TerminalEntry[]>([])
  const [command, setCommand] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const autoStartRef = useRef(false)

  const tab = prefs.tab

  const refreshApp = useCallback(async () => {
    const res = await fetch('/api/dev/apps', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    const row = (data.apps as DevAppRow[] | undefined)?.find((a) => a.id === appId)
    if (row) setApp(row)
  }, [appId])

  const refreshLogs = useCallback(async () => {
    const res = await fetch(`/api/dev/apps/${appId}/logs`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setLogs(data.logs ?? [])
  }, [appId])

  const refreshTerminal = useCallback(async () => {
    const res = await fetch('/api/dev/terminal', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setTerminalSessions(data.sessions ?? [])
  }, [])

  usePoll(refreshApp, 4000)
  usePoll(refreshLogs, 1500, tab === 'logs')
  usePoll(refreshTerminal, 2000, tab === 'terminal')

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  async function runAction(action: 'restart' | 'start' | 'stop') {
    setBusy(true)
    try {
      await fetch(`/api/dev/apps/${appId}/${action}`, { method: 'POST' })
      await refreshApp()
      await refreshLogs()
      if (action === 'restart') setIframeKey((k) => k + 1)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!app || autoStartRef.current) return
    if (app.runtime?.status === 'stopped') {
      autoStartRef.current = true
      void runAction('start')
    }
  }, [app])

  async function submitTerminal(e: React.FormEvent) {
    e.preventDefault()
    const cmd = command.trim()
    if (!cmd) return
    setCommand('')
    await fetch('/api/dev/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, cwd: app?.packagePath }),
    })
    await refreshTerminal()
    setPrefs({ tab: 'terminal' })
  }

  const status = app?.runtime?.status ?? 'stopped'
  const isActive = status === 'running' || status === 'starting'
  const showPreview = isActive
  const previewUrl = app?.localUrl ?? ''
  const warmingUp = status === 'starting' || (status === 'running' && !app?.healthy)

  const preview = (
    <>
      <div className="dev-hub-preview-bar">
        {app && (
          <PortControl
            appId={appId}
            port={app.port}
            defaultPort={app.defaultPort}
            localHost={app.localHost}
            compact
            disabled={isActive || busy}
            onApplied={() => void refreshApp()}
          />
        )}
        <span className="dev-hub-preview-url">{previewUrl || '—'}</span>
        <span className={`dev-hub-preview-status ${app?.healthy ? 'dev-hub-preview-status--ok' : ''}`}>
          {status}
          {app?.healthy ? ' · ready' : warmingUp ? ' · warming up' : ''}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-inline"
          disabled={!isActive}
          onClick={() => setIframeKey((k) => k + 1)}
        >
          <RefreshCw size={14} />
          Refresh view
        </button>
        <a
          href={isActive ? previewUrl : undefined}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm btn-inline"
          style={{ pointerEvents: isActive ? 'auto' : 'none', opacity: isActive ? 1 : 0.4 }}
        >
          New tab
        </a>
      </div>
      <div className="dev-hub-iframe-wrap">
        {showPreview && previewUrl ? (
          <>
            <iframe key={iframeKey} src={previewUrl} title={app?.name ?? appId} />
            {warmingUp && (
              <div className="dev-hub-iframe-loading">
                <span className="spinner-mini" />
                Starting {app?.name ?? appId}…
              </div>
            )}
          </>
        ) : (
          <div className="dev-hub-iframe-placeholder">
            <p>{status === 'error' ? 'App failed to start. Check logs.' : 'App is not running.'}</p>
            <button
              type="button"
              className="btn btn-success btn-inline"
              disabled={busy}
              onClick={() => void runAction('start')}
            >
              Start {app?.name ?? appId}
            </button>
          </div>
        )}
      </div>
    </>
  )

  const panel = (
    <>
      <div className="dev-hub-panel-tabs">
        <button
          type="button"
          className={`dev-hub-panel-tab ${tab === 'logs' ? 'active' : ''}`}
          onClick={() => setPrefs({ tab: 'logs' })}
        >
          Logs
        </button>
        <button
          type="button"
          className={`dev-hub-panel-tab ${tab === 'terminal' ? 'active' : ''}`}
          onClick={() => setPrefs({ tab: 'terminal' })}
        >
          <Terminal size={12} style={{ display: 'inline', marginRight: 4 }} />
          Bash
        </button>
      </div>

      <div className="dev-hub-panel-controls">
        {!isActive ? (
          <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => void runAction('start')}>
            Start
          </button>
        ) : (
          <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => void runAction('stop')}>
            Stop
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void runAction('restart')}>
          <RotateCcw size={14} />
          Restart
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshLogs()}>
          <RefreshCw size={14} />
          Logs
        </button>
      </div>

      {tab === 'logs' ? (
        <div className="dev-hub-log-view" role="log" aria-live="polite">
          {logs.map((line, i) => (
            <div key={`${i}-${line.slice(0, 24)}`} className="dev-hub-log-line">
              {line}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      ) : (
        <div className="dev-hub-log-view" role="log">
          {terminalSessions.length === 0 && (
            <p className="dev-hub-log-line" style={{ color: 'var(--text-sub)' }}>
              Run bash or PowerShell commands against the monorepo root (or app folder).
            </p>
          )}
          {terminalSessions.map((session) => (
            <div key={session.id} style={{ marginBottom: '1rem' }}>
              {session.logs.map((line, i) => (
                <div key={`${session.id}-${i}`} className="dev-hub-log-line">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <form className="dev-hub-terminal-input" onSubmit={(e) => void submitTerminal(e)}>
        <input
          className="form-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Shell command (bash / PowerShell)…"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-primary btn-sm btn-inline">
          Run
        </button>
      </form>
    </>
  )

  return (
    <DevHubShell title={app?.name ?? appId} subtitle={app?.description ?? 'App workspace'}>
      <Link href="/dashboard" className="dev-hub-back">
        <ArrowLeft size={16} />
        All apps
      </Link>

      {hydrated ? (
        <ResizableWorkspace prefs={prefs} setPrefs={setPrefs} resetLayout={resetLayout} preview={preview} panel={panel} />
      ) : (
        <p className="dev-hub-empty">Loading workspace…</p>
      )}
    </DevHubShell>
  )
}
