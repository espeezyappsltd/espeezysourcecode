'use client'

import { RotateCcw, Square, Play, Terminal } from 'lucide-react'
import { LogStream } from './LogStream'
import type { TerminalEntry } from './types'
import type { WorkspaceTab } from './useWorkspaceLayout'

type Props = {
  tab: WorkspaceTab
  onTab: (tab: WorkspaceTab) => void
  isActive: boolean
  actionBusy: string | null
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  logs: string[]
  terminalSessions: TerminalEntry[]
  command: string
  onCommandChange: (v: string) => void
  onRunCommand: () => void
}

export function WorkspacePanel({
  tab,
  onTab,
  isActive,
  actionBusy,
  onStart,
  onStop,
  onRestart,
  logs,
  terminalSessions,
  command,
  onCommandChange,
  onRunCommand,
}: Props) {
  const terminalLines = terminalSessions.flatMap((s) => s.logs)

  return (
    <div className="dev-hub-panel-inner">
      <div className="dev-hub-panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'logs'}
          className={`dev-hub-panel-tab dev-hub-tap ${tab === 'logs' ? 'active' : ''}`}
          onClick={() => onTab('logs')}
        >
          Logs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'terminal'}
          className={`dev-hub-panel-tab dev-hub-tap ${tab === 'terminal' ? 'active' : ''}`}
          onClick={() => onTab('terminal')}
        >
          <Terminal size={12} aria-hidden />
          Bash
        </button>
      </div>

      <div className="dev-hub-panel-controls">
        {!isActive ? (
          <button
            type="button"
            className="dev-hub-action-btn btn btn-success btn-sm"
            disabled={actionBusy !== null}
            onClick={onStart}
          >
            <Play size={14} aria-hidden />
            {actionBusy === 'start' ? 'Starting…' : 'Start'}
          </button>
        ) : (
          <button
            type="button"
            className="dev-hub-action-btn btn btn-danger btn-sm"
            disabled={actionBusy !== null}
            onClick={onStop}
          >
            <Square size={14} aria-hidden />
            {actionBusy === 'stop' ? 'Stopping…' : 'Stop'}
          </button>
        )}
        <button
          type="button"
          className="dev-hub-action-btn btn btn-secondary btn-sm"
          disabled={actionBusy !== null}
          onClick={onRestart}
        >
          <RotateCcw size={14} aria-hidden />
          {actionBusy === 'restart' ? 'Restarting…' : 'Restart'}
        </button>
      </div>

      <div className="dev-hub-panel-body">
        {tab === 'logs' ? (
          <LogStream lines={logs} emptyMessage="No logs yet. Start the app or check stderr output." />
        ) : (
          <LogStream
            lines={terminalLines}
            emptyMessage="Run a shell command below — output appears here."
          />
        )}
      </div>

      <form
        className="dev-hub-terminal-input"
        onSubmit={(e) => {
          e.preventDefault()
          onRunCommand()
        }}
      >
        <input
          className="form-input dev-hub-terminal-field"
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          placeholder="Shell command (bash / PowerShell)…"
          spellCheck={false}
          enterKeyHint="go"
        />
        <button type="submit" className="dev-hub-action-btn btn btn-primary btn-sm btn-inline" disabled={!command.trim()}>
          Run
        </button>
      </form>
    </div>
  )
}
