'use client'

import { useEffect, useState } from 'react'

type Props = {
  appId: string
  port: number
  defaultPort: number
  localHost: string
  disabled?: boolean
  compact?: boolean
  onApplied?: () => void
}

export function PortControl({
  appId,
  port,
  defaultPort,
  localHost,
  disabled,
  compact,
  onApplied,
}: Props) {
  const [value, setValue] = useState(String(port))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(String(port))
  }, [port])

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
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = parseInt(value, 10)
              if (Number.isFinite(n)) void applyPort(n)
            }
          }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-inline"
          disabled={disabled || saving || parseInt(value, 10) === port}
          onClick={() => {
            const n = parseInt(value, 10)
            if (Number.isFinite(n)) void applyPort(n)
          }}
        >
          {saving ? '…' : 'Apply'}
        </button>
        {port !== defaultPort && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-inline"
            disabled={disabled || saving}
            title={`Reset to default :${defaultPort}`}
            onClick={() => void applyPort(defaultPort)}
          >
            :{defaultPort}
          </button>
        )}
      </div>
      {error && <p className="dev-hub-port-error">{error}</p>}
    </div>
  )
}
