'use client'

import { Trash2 } from 'lucide-react'
import type { UseTaskModalReturn } from './useTaskModal'

export type TaskModalFooterProps = Pick<
  UseTaskModalReturn,
  'isEditMode' | 'loading' | 'onClose' | 'handleSave' | 'handleDelete'
>

export function TaskModalFooter({ isEditMode, loading, onClose, handleSave, handleDelete }: TaskModalFooterProps) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        backgroundColor: 'var(--bg-sub)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {isEditMode && (
        <button
          className="btn btn-sm btn-inline"
          onClick={handleDelete}
          disabled={loading}
          style={{ color: 'var(--error)', backgroundColor: 'transparent', marginRight: 'auto' }}
        >
          <Trash2 size={14} /> Delete
        </button>
      )}
      <button className="btn btn-secondary btn-sm btn-inline" onClick={onClose}>
        Cancel
      </button>
      <button className="btn btn-primary btn-sm btn-inline" onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Task'}
      </button>
    </div>
  )
}
