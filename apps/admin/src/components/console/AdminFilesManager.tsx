'use client'

import { useCallback, useEffect, useState } from 'react'

type VaultFile = {
  id: string
  name: string
  mime_type: string | null
  size_bytes: number
  created_at: string
}

type VaultFolder = { id: string; name: string; parent_id: string | null; created_at: string }

type Staff = { id: string; username: string; display_name: string | null }

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export function AdminFilesManager() {
  const [folders, setFolders] = useState<VaultFolder[]>([])
  const [files, setFiles] = useState<VaultFile[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [used, setUsed] = useState(0)
  const [cap, setCap] = useState(5 * 1024 ** 3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newFolder, setNewFolder] = useState('')
  const [shareTarget, setShareTarget] = useState('')
  const [shareFileId, setShareFileId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/vault', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load vault')
      setFolders(data.folders ?? [])
      setFiles(data.files ?? [])
      setStaff(data.staff ?? [])
      setUsed(data.quota?.used ?? 0)
      setCap(data.quota?.cap ?? cap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [cap])

  useEffect(() => {
    void load()
  }, [load])

  async function createFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolder.trim()) return
    const res = await fetch('/api/admin/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_folder', name: newFolder.trim() }),
    })
    if (res.ok) {
      setNewFolder('')
      void load()
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/vault/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Upload failed')
    }
    e.target.value = ''
    void load()
  }

  async function deleteFile(id: string) {
    if (!confirm('Delete this file?')) return
    await fetch(`/api/admin/vault/${id}`, { method: 'DELETE' })
    void load()
  }

  async function shareFile(e: React.FormEvent) {
    e.preventDefault()
    if (!shareFileId || !shareTarget) return
    await fetch('/api/admin/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'share',
        resource_type: 'file',
        resource_id: shareFileId,
        shared_with: shareTarget,
        permission: 'read',
      }),
    })
    setShareFileId('')
    setShareTarget('')
    void load()
  }

  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0

  return (
    <>
      <div className="admin-console-card">
        <h2>Storage quota</h2>
        <p style={{ fontSize: '0.875rem', color: '#5f6368', margin: '0 0 0.5rem' }}>
          {formatBytes(used)} of {formatBytes(cap)} used ({pct.toFixed(1)}%)
        </p>
        <div className="admin-console-quota-bar">
          <div className="admin-console-quota-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {error && (
        <p style={{ color: '#d93025', fontSize: '0.875rem', marginBottom: '1rem' }} role="alert">
          {error}
        </p>
      )}

      <div className="admin-console-card">
        <h2>New folder</h2>
        <form onSubmit={createFolder} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="admin-console-input"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="Folder name"
          />
          <button type="submit" className="admin-console-btn admin-console-btn-primary">
            Create
          </button>
        </form>
      </div>

      <div className="admin-console-card">
        <h2>Upload file</h2>
        <input type="file" onChange={onUpload} />
      </div>

      <div className="admin-console-card">
        <h2>Share with staff</h2>
        <form onSubmit={shareFile} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <select
            className="admin-console-input"
            style={{ width: 'auto', minWidth: '160px' }}
            value={shareFileId}
            onChange={(e) => setShareFileId(e.target.value)}
          >
            <option value="">Select file</option>
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            className="admin-console-input"
            style={{ width: 'auto', minWidth: '140px' }}
            value={shareTarget}
            onChange={(e) => setShareTarget(e.target.value)}
          >
            <option value="">Share with</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name || s.username}
              </option>
            ))}
          </select>
          <button type="submit" className="admin-console-btn admin-console-btn-primary">
            Share
          </button>
        </form>
      </div>

      <div className="admin-console-card">
        <h2>Folders & files</h2>
        {loading ? (
          <p style={{ color: '#5f6368' }}>Loading…</p>
        ) : (
          <table className="admin-console-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {folders.map((f) => (
                <tr key={f.id}>
                  <td>📁 {f.name}</td>
                  <td>Folder</td>
                  <td>—</td>
                  <td />
                </tr>
              ))}
              {files.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.mime_type ?? 'file'}</td>
                  <td>{formatBytes(f.size_bytes)}</td>
                  <td>
                    <button type="button" className="admin-console-btn" onClick={() => deleteFile(f.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {folders.length === 0 && files.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: '#5f6368' }}>
                    No files yet. Upload or create a folder.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
