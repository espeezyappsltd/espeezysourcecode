'use client'

import { Trash2 } from 'lucide-react'
import type { SettingsPageViewModel } from '../settings-types'

export function SettingsDataPanel({ vm }: { vm: SettingsPageViewModel }) {
  const { handleDownloadData, setIsDeleteModalOpen } = vm

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Personal Data Management</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>
          Audit and export your activity within the Espeezy ecosystem.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div>
            <h4 style={{ margin: 0 }}>Export My Data</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)' }}>Download all your task and activity data.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleDownloadData} style={{ width: 'auto' }}>
            Export
          </button>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%', border: '1.5px solid var(--error)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={24} /> Danger Zone
        </h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Terminating your account is an irreversible action. You will lose access to all teams, progress metrics, specialized badges, and verifiable audit logs.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--error)', fontWeight: 800 }}>Delete this account</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)' }}>Once you delete your account, there is no going back. Please be certain.</p>
          </div>
          <button type="button" className="btn" onClick={() => setIsDeleteModalOpen(true)} style={{ width: 'auto', background: 'var(--error)', color: 'white' }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
