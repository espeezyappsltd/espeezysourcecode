'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
import { PortControl } from '@/components/dev-hub/PortControl'
import { ResizableWorkspace } from '@/components/dev-hub/ResizableWorkspace'
import { WorkspacePanel } from '@/components/dev-hub/WorkspacePanel'
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
  const [draftPort, setDraftPort] = useState<number | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const autoStartRef = useRef(false)
  const actionLockRef = useRef(false)

  const tab = prefs.tab

  const refreshApp = useCallback(async () => {
    const res = await fetch('/api/dev/apps', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    const row = (data.apps as DevAppRow[] | undefined)?.find((a) => a.id === appId)
    if (row) {
      setApp(row)
      setDraftPort((prev) => prev ?? row.port)
    }
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
  usePoll(refreshLogs, 1200)
  usePoll(refreshTerminal, 1500, tab === 'terminal')

  const runAction = useCallback(
    async (action: 'restart' | 'start' | 'stop') => {
      if (actionLockRef.current) return
      actionLockRef.current = true
      setActionBusy(action)
      try {
        const port = draftPort ?? app?.port
        const needsBody = (action === 'start' || action === 'restart') && port != null
        await fetch(`/api/dev/apps/${appId}/${action}`, {
          method: 'POST',
          headers: needsBody ? { 'Content-Type': 'application/json' } : undefined,
          body: needsBody ? JSON.stringify({ port }) : undefined,
        })
        void refreshApp()
        void refreshLogs()
        if (action === 'restart' || action === 'start') setIframeKey((k) => k + 1)
      } finally {
        actionLockRef.current = false
        setActionBusy(null)
      }
    },
    [appId, app?.port, draftPort, refreshApp, refreshLogs],
  )

  useEffect(() => {
    if (!app || autoStartRef.current) return
    if (app.runtime?.status === 'stopped') {
      autoStartRef.current = true
      void runAction('start')
    }
  }, [app, runAction])

  const submitTerminal = useCallback(async () => {
    const cmd = command.trim()
    if (!cmd || actionLockRef.current) return
    setCommand('')
    actionLockRef.current = true
    setActionBusy('terminal')
    try {
      await fetch('/api/dev/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, cwd: app?.packagePath }),
      })
      setPrefs({ tab: 'terminal' })
      void refreshTerminal()
    } finally {
      actionLockRef.current = false
      setActionBusy(null)
    }
  }, [app?.packagePath, command, refreshTerminal, setPrefs])

  const status = app?.runtime?.status ?? 'stopped'
  const isActive = status === 'running' || status === 'starting'
  const showPreview = isActive
  const previewUrl = app?.localUrl ?? ''
  const warmingUp = status === 'starting' || (status === 'running' && !app?.healthy)
  const effectivePort = draftPort ?? app?.port ?? 3000

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
            deferApply
            disabled={actionBusy !== null}
            onPortDraft={setDraftPort}
            onApplied={() => void refreshApp()}
          />
        )}
        <span className="dev-hub-preview-url">{previewUrl || `http://${app?.localHost ?? 'localhost'}:${effectivePort}`}</span>
        <span className={`dev-hub-preview-status ${app?.healthy ? 'dev-hub-preview-status--ok' : ''}`}>
          {status}
          {app?.healthy ? ' · ready' : warmingUp ? ' · warming up' : ''}
        </span>
        <button
          type="button"
          className="dev-hub-action-btn btn btn-ghost btn-sm btn-inline"
          disabled={!isActive}
          onClick={() => setIframeKey((k) => k + 1)}
        >
          <RefreshCw size={14} aria-hidden />
          Refresh
        </button>
        <a
          href={isActive ? previewUrl : undefined}
          target="_blank"
          rel="noreferrer"
          className="dev-hub-action-btn btn btn-secondary btn-sm btn-inline"
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
              className="dev-hub-action-btn btn btn-success btn-inline"
              disabled={actionBusy !== null}
              onClick={() => void runAction('start')}
            >
              {actionBusy === 'start' ? 'Starting…' : `Start ${app?.name ?? appId}`}
            </button>
          </div>
        )}
      </div>
    </>
  )

  const panel = (
    <WorkspacePanel
      tab={tab}
      onTab={(t) => setPrefs({ tab: t })}
      isActive={isActive}
      actionBusy={actionBusy}
      onStart={() => void runAction('start')}
      onStop={() => void runAction('stop')}
      onRestart={() => void runAction('restart')}
      logs={logs}
      terminalSessions={terminalSessions}
      command={command}
      onCommandChange={setCommand}
      onRunCommand={() => void submitTerminal()}
    />
  )

  return (
    <DevHubShell title={app?.name ?? appId} subtitle={app?.description ?? 'App workspace'}>
      <Link href="/dashboard" className="dev-hub-back dev-hub-tap">
        <ArrowLeft size={16} aria-hidden />
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
