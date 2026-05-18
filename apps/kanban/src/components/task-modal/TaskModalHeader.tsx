'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import type { UseTaskModalReturn } from './useTaskModal'

export type TaskModalHeaderProps = Pick<
  UseTaskModalReturn,
  'isEditMode' | 'assignees' | 'members' | 'onClose' | 'onProfileClick'
>

export function TaskModalHeader({
  isEditMode,
  assignees,
  members,
  onClose,
  onProfileClick,
}: TaskModalHeaderProps) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-sub)',
        flexShrink: 0,
      }}
    >
      <h2
        style={{
          fontSize: '1.1rem',
          margin: 0,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {isEditMode ? 'Edit Task' : 'New Task'}
        {isEditMode && assignees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
            <div style={{ display: 'flex', marginRight: '0.5rem' }}>
              {assignees.slice(0, 3).map((userId, i) => {
                const m = members.find((p) => p.id === userId)
                return (
                  <div
                    key={userId}
                    onClick={() => onProfileClick(userId)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-sub)',
                      marginLeft: i === 0 ? 0 : '-8px',
                      backgroundColor: 'var(--brand)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      zIndex: 10 - i,
                    }}
                    title={m?.full_name || 'Assigned User'}
                  >
                    {m?.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt={m.full_name || 'avatar'}
                        width={32}
                        height={32}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white',
                        }}
                      >
                        {(m?.full_name || '?')[0]}
                      </div>
                    )}
                  </div>
                )
              })}
              {assignees.length > 3 && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-sub)',
                    marginLeft: '-8px',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    zIndex: 0,
                  }}
                >
                  +{assignees.length - 3}
                </div>
              )}
            </div>
            <span className="badge hide-tiny" style={{ backgroundColor: 'var(--brand)', color: 'white', fontSize: '0.7rem' }}>
              {assignees.length} Assigned
            </span>
          </div>
        )}
      </h2>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}
        aria-label="Close modal"
      >
        <X size={20} />
      </button>
    </div>
  )
}
