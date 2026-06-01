'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Settings, Trash2 } from 'lucide-react'

type Props = {
  onEdit: () => void
  onDelete: () => void
}

export function ProjectActionsMenu({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div className="jobs-actions-menu" ref={rootRef}>
      <button
        type="button"
        className={`studio-crud__gear jobs-workspace__settings${open ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Project actions"
        onClick={() => setOpen((v) => !v)}
      >
        <Settings size={18} aria-hidden />
      </button>
      {open ? (
        <div className="jobs-actions-menu__panel" role="menu">
          <button
            type="button"
            className="jobs-actions-menu__item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            <Pencil size={16} aria-hidden />
            Edit project
          </button>
          <button
            type="button"
            className="jobs-actions-menu__item jobs-actions-menu__item--danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            <Trash2 size={16} aria-hidden />
            Delete project
          </button>
        </div>
      ) : null}
    </div>
  )
}
