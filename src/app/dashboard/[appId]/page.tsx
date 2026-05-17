'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppPreviewPane } from '@/components/dev-hub/AppPreviewPane'
import { DevHubShell } from '@/components/dev-hub/DevHubShell'
import { ResizableWorkspace } from '@/components/dev-hub/ResizableWorkspace'
import { WorkspacePanel } from '@/components/dev-hub/WorkspacePanel'
import { usePoll } from '@/components/dev-hub/usePoll'
import { useWorkspaceLayout } from '@/components/dev-hub/useWorkspaceLayout'
import type { DevAppRow, TerminalEntry } from '@/components/dev-hub/types'

export default function AppWorkspacePage() {
  const params = useParams()
  const appId = String(params.appId ?? '')
  const { prefs, setPrefs, setPreviewMode, setPreviewA11y, resetLayout, hydrated } = useWorkspaceLayout(appId)
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
    async (action: 'restart' | 'start' | 'stop' | 'debug') => {
      if (actionLockRef.current) return
      actionLockRef.current = true
      setActionBusy(action)
      try {
        const port = draftPort ?? app?.port
        const path = action === 'debug' ? 'debug' : action
        const needsBody = (action === 'start' || action === 'restart' || action === 'debug') && port != null
        await fetch(`/api/dev/apps/${appId}/${path}`, {
          method: 'POST',
          headers: needsBody ? { 'Content-Type': 'application/json' } : undefined,
          body: needsBody ? JSON.stringify({ port }) : undefined,
        })
        void refreshApp()
        void refreshLogs()
        if (action === 'restart' || action === 'start' || action === 'debug') setIframeKey((k) => k + 1)
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

  const preview = app ? (
    <AppPreviewPane
      appId={appId}
      appName={app.name}
      port={app.port}
      defaultPort={app.defaultPort}
      localHost={app.localHost}
      previewUrl={previewUrl}
      effectivePort={effectivePort}
      status={status}
      healthy={!!app.healthy}
      warmingUp={warmingUp}
      isActive={isActive}
      showPreview={showPreview}
      iframeKey={iframeKey}
      actionBusy={actionBusy}
      previewMode={prefs.previewMode}
      a11y={prefs.previewA11y}
      onPreviewMode={setPreviewMode}
      onA11y={setPreviewA11y}
      onPortDraft={setDraftPort}
      onRefreshApp={() => void refreshApp()}
      onRefreshIframe={() => setIframeKey((k) => k + 1)}
      onStart={() => void runAction('start')}
    />
  ) : null

  const panel = (
    <WorkspacePanel
      tab={tab}
      onTab={(t) => setPrefs({ tab: t })}
      isActive={isActive}
      actionBusy={actionBusy}
      runtime={app?.runtime}
      accent={app?.accent}
      onStart={() => void runAction('start')}
      onDebug={() => void runAction('debug')}
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
    <DevHubShell title={app?.name ?? appId} subtitle={app?.description ?? 'App workspace'} fullHeight>
      {hydrated ? (
        <ResizableWorkspace prefs={prefs} setPrefs={setPrefs} resetLayout={resetLayout} preview={preview} panel={panel} />
      ) : (
        <p className="dev-hub-empty">Loading workspace…</p>
      )}
    </DevHubShell>
  )
}
