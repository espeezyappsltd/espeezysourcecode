'use client'

import { useState } from 'react'
import ModalOverlay from '@/components/ModalOverlay'
import { FormField } from '@/components/forms/FormField'

export function FolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <ModalOverlay maxWidth="400px" onClickOutside={onClose}>
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontWeight: 950, color: 'var(--text-main)' }}>New folder</h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Organize uploads in a virtual folder. Names cannot include slashes.
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <FormField label="Folder name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lecture notes"
              style={{ width: '100%' }}
              onKeyDown={(e) => e.key === 'Enter' && onCreate(name)}
            />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => onCreate(name)}>
            Create
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
