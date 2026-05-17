'use client'

import { useEffect, useState } from 'react'

type Props = {
  appId: string
  port: number
  defaultPort: number
  localHost: string
  disabled?: boolean
  compact?: boolean
  /** When true, port is sent with Start/Restart — no separate Apply click. */
  deferApply?: boolean
  onPortDraft?: (port: number) => void
  onApplied?: () => void
}

export function PortControl({
  appId,
  port,
  defaultPort,
  localHost,
  disabled,
  compact,
  deferApply,
  onPortDraft,
  onApplied,
}: Props) {
  const [value, setValue] = useState(String(port))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(String(port))
  }, [port])

  function emitDraft(next: string) {
    const n = parseInt(next, 10)
    if (Number.isFinite(n)) onPortDraft?.(n)
  }

  async function applyPort(nextPort: number) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/apps/${appId}/port`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: nextPort }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not set port')
        return
      }
      setValue(String(nextPort))
      onApplied?.()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`dev-hub-port-control ${compact ? 'dev-hub-port-control--compact' : ''}`}>
      <label className="dev-hub-port-label" htmlFor={`port-${appId}`}>
        Local URL
      </label>
      <div className="dev-hub-port-row">
        <span className="dev-hub-port-host">{localHost}:</span>
        <input
          id={`port-${appId}`}
          type="number"
          min={1024}
          max={65535}
          className="form-input dev-hub-port-input"
          value={value}
          disabled={disabled || saving}
          onChange={(e) => {
            setValue(e.target.value)
            emitDraft(e.target.value)
          }}
          onBlur={() => {
            if (deferApply) return
            const n = parseInt(value, 10)
            if (Number.isFinite(n) && n !== port) void applyPort(n)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !deferApply) {
              const n = parseInt(value, 10)
              if (Number.isFinite(n)) void applyPort(n)
            }
          }}
        />
        {!deferApply && (
          <button
            type="button"
            className="dev-hub-action-btn btn btn-secondary btn-sm btn-inline"
            disabled={disabled || saving || parseInt(value, 10) === port}
            onClick={() => {
              const n = parseInt(value, 10)
              if (Number.isFinite(n)) void applyPort(n)
            }}
          >
            {saving ? '…' : 'Apply'}
          </button>
        )}
        {port !== defaultPort && !deferApply && (
          <button
            type="button"
            className="dev-hub-action-btn btn btn-ghost btn-sm btn-inline"
            disabled={disabled || saving}
            title={`Reset to default :${defaultPort}`}
            onClick={() => void applyPort(defaultPort)}
          >
            :{defaultPort}
          </button>
        )}
      </div>
      {deferApply && (
        <p className="dev-hub-port-hint">Port applies when you click Start or Restart.</p>
      )}
      {error && <p className="dev-hub-port-error">{error}</p>}
    </div>
  )
}
