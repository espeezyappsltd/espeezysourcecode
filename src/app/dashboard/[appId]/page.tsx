'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, RefreshCw, RotateCcw, Terminal } from 'lucide-react'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
import { usePoll } from '@/components/dev-hub/usePoll'
import type { DevAppRow, TerminalEntry } from '@/components/dev-hub/types'

type PanelTab = 'logs' | 'terminal'

export default function AppWorkspacePage() {
  const params = useParams()
  const appId = String(params.appId ?? '')
  const [app, setApp] = useState<DevAppRow | null>(null)
  const [tab, setTab] = useState<PanelTab>('logs')
  const [logs, setLogs] = useState<string[]>([])
  const [terminalSessions, setTerminalSessions] = useState<TerminalEntry[]>([])
  const [command, setCommand] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const autoStartRef = useRef(false)

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
    setTab('terminal')
  }

  const isRunning = app?.runtime?.status === 'running' || app?.runtime?.status === 'starting'
  const previewUrl = app?.localUrl ?? ''

  return (
    <DevHubShell title={app?.name ?? appId} subtitle={app?.description ?? 'App workspace'}>
      <Link href="/dashboard" className="dev-hub-back">
        <ArrowLeft size={16} />
        All apps
      </Link>

      <div className="dev-hub-workspace">
        <section className="dev-hub-preview">
          <div className="dev-hub-preview-bar">
            <span className="dev-hub-preview-url">{previewUrl || '—'}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-inline"
              disabled={!isRunning}
              onClick={() => setIframeKey((k) => k + 1)}
            >
              <RefreshCw size={14} />
              Refresh view
            </button>
            <a
              href={isRunning ? previewUrl : undefined}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm btn-inline"
              style={{ pointerEvents: isRunning ? 'auto' : 'none', opacity: isRunning ? 1 : 0.4 }}
            >
              New tab
            </a>
          </div>
          <div className="dev-hub-iframe-wrap">
            {isRunning && previewUrl ? (
              <iframe key={iframeKey} src={previewUrl} title={app?.name ?? appId} />
            ) : (
              <div className="dev-hub-iframe-placeholder">
                <p>App is not running.</p>
                <button type="button" className="btn btn-success btn-inline" disabled={busy} onClick={() => void runAction('start')}>
                  Start {app?.name ?? appId}
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="dev-hub-panel">
          <div className="dev-hub-panel-tabs">
            <button
              type="button"
              className={`dev-hub-panel-tab ${tab === 'logs' ? 'active' : ''}`}
              onClick={() => setTab('logs')}
            >
              Logs
            </button>
            <button
              type="button"
              className={`dev-hub-panel-tab ${tab === 'terminal' ? 'active' : ''}`}
              onClick={() => setTab('terminal')}
            >
              <Terminal size={12} style={{ display: 'inline', marginRight: 4 }} />
              Bash
            </button>
          </div>

          <div className="dev-hub-panel-controls">
            {!isRunning ? (
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
        </aside>
      </div>
    </DevHubShell>
  )
}
