'use client'

/**
 * AdminLiveLogs
 *
 * The right-side column of the "Operational Terminal" section.
 * Contains two stacked cards:
 *   1. LIVE_TERMINAL_LOGS — a scrolling list of system log entries
 *   2. UI Orchestrator    — a call-to-action card that opens the theme studio
 *
 * Props:
 *   logs           — array of log entries from the heartbeat interval
 *   onLaunchStudio — navigates to /dashboard/settings?tab=themes
 */

import { Activity, Globe } from 'lucide-react'
import type { SystemLog } from './types'

interface Props {
  logs: SystemLog[]
  onLaunchStudio: () => void
}

export default function AdminLiveLogs({ logs, onLaunchStudio }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <LiveTerminal logs={logs} />
      <UIOrchestrator onLaunchStudio={onLaunchStudio} />
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────────────────────────

/** The scrolling terminal log panel. */
function LiveTerminal({ logs }: { logs: SystemLog[] }) {
  return (
    <div
      style={{
        padding: '2rem',
        background: '#000',
        border: '1px solid #111',
        borderRadius: '32px',
        fontFamily: 'monospace',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#10b981',
          fontSize: '0.8rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}
        role="status"
        aria-label="Live terminal logs"
      >
        {/* Pulsing dot */}
        <div
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            animation: 'logPulse 2s infinite',
          }}
        />
        LIVE_TERMINAL_LOGS
      </div>

      {/* Log entries */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          fontSize: '0.7rem',
        }}
      >
        {logs.map((log, i) => (
          <LogEntry key={i} log={log} />
        ))}
      </div>

      {/* Pulse keyframe — scoped to this component */}
      <style jsx>{`
        @keyframes logPulse {
          0%   { opacity: 1; }
          50%  { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/** One row in the terminal stream. */
function LogEntry({ log }: { log: SystemLog }) {
  // Highlight entries that contain "OK" in green; all others stay white
  const messageColor = log.m.includes('OK') ? '#10b981' : 'white'

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <span style={{ opacity: 0.3, flexShrink: 0 }}>[{log.t}]</span>
      <span style={{ color: messageColor }}>{log.m}</span>
    </div>
  )
}

/** The UI Orchestrator CTA card. */
function UIOrchestrator({ onLaunchStudio }: { onLaunchStudio: () => void }) {
  return (
    <div
      style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
        borderRadius: '32px',
        color: 'black',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative large icon */}
      <Globe
        size={180}
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          opacity: 0.1,
          color: 'black',
          pointerEvents: 'none',
        }}
      />

      <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '1rem' }}>
        UI Orchestrator
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '2rem',
          opacity: 0.8,
          maxWidth: '200px',
        }}
      >
        Access experimental aesthetic routing and theme engineering suite.
      </p>

      <button
        onClick={onLaunchStudio}
        style={{
          background: 'black',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '16px',
          fontWeight: 950,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
        }}
      >
        LAUNCH STUDIO
        <Activity size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
