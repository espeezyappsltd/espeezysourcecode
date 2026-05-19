'use client'

import { AlertTriangle, Settings } from 'lucide-react'
import TransientError from '@/components/TransientError'
import SettingsLoading from '@/components/settings/SettingsLoading'
import { SettingsTabNav } from '@/components/settings/SettingsTabNav'
import { SettingsTabPanels } from '@/components/settings/SettingsTabPanels'
import { useSettingsPage } from '@/components/settings/useSettingsPage'
import { FormField } from '@/components/forms/FormField'

export default function SettingsPage() {
  const vm = useSettingsPage()
  const { loading, error, isDeleteModalOpen, setDeleteConfirmation, deleteConfirmation, isDeleting, handleAccountTermination, setIsDeleteModalOpen } = vm

  if (loading) {
    return <SettingsLoading />
  }

  return (
    <div className="page-fade page-shell page-shell--narrow">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '8px', background: 'var(--brand)', borderRadius: '12px' }}>
          <Settings size={28} color="white" />
        </div>
        <h1 className="fluid-h1" style={{ margin: 0, fontWeight: 900 }}>
          Settings
        </h1>
      </div>

      {error && <TransientError message={error} />}

      <SettingsTabNav vm={vm} />

      <SettingsTabPanels vm={vm} />

      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', color: 'var(--error)' }}>
              <AlertTriangle size={60} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Final Confirmation</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              This will <strong>permanently delete</strong> your Espeezy account and all associated data. This action cannot be undone.
            </p>
            <FormField label="Confirmation" hint="Type DELETE to confirm">
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                style={{ border: '2px solid var(--error)', textAlign: 'center', fontWeight: 'bold' }}
              />
            </FormField>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleAccountTermination}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                style={{ background: 'var(--error)', color: 'white', opacity: deleteConfirmation === 'DELETE' ? 1 : 0.4 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --gap-sm: 2.5rem;
            --avatar-size: 120px;
          }
          @media (max-width: 768px) {
            :root {
              --gap-sm: 1.25rem;
              --avatar-size: 80px;
            }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
       `,
        }}
      />
    </div>
  )
}
