'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudioEditor } from '@/hooks/useStudioEditor'

export type CrudFieldType = 'text' | 'number' | 'url' | 'color'

export type CrudField<T> = {
  key: keyof T & string
  label: string
  type?: CrudFieldType
  placeholder?: string
  min?: number
  max?: number
}

type Props<T extends { id: string }> = {
  table: string
  title: string
  fields: CrudField<T>[]
  orderBy?: { column: string; ascending?: boolean }
  emptyLabel?: string
  renderRow: (row: T) => ReactNode
  buildEmpty: () => Omit<T, 'id'>
  onMutate?: () => void
}

export function StudioCrudPanel<T extends { id: string }>({
  table,
  title,
  fields,
  orderBy = { column: 'sort_order', ascending: true },
  emptyLabel = 'No items yet.',
  renderRow,
  buildEmpty,
  onMutate,
}: Props<T>) {
  const { canEdit, loading: authLoading } = useStudioEditor()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, string | number>>({})

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from(table)
      .select('*')
      .order(orderBy.column, { ascending: orderBy.ascending ?? true })
    if (err) {
      setError(err.message)
      setRows([])
    } else {
      setRows((data ?? []) as T[])
    }
    setLoading(false)
  }, [table, orderBy.ascending, orderBy.column])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  function openCreate() {
    const empty = buildEmpty()
    const initial: Record<string, string | number> = {}
    for (const f of fields) {
      const v = empty[f.key as keyof typeof empty]
      initial[f.key] = typeof v === 'number' ? v : String(v ?? '')
    }
    setEditing(null)
    setForm(initial)
    setModalOpen(true)
  }

  function openEdit(row: T) {
    const initial: Record<string, string | number> = {}
    for (const f of fields) {
      const v = row[f.key as keyof T]
      initial[f.key] = typeof v === 'number' ? v : String(v ?? '')
    }
    setEditing(row)
    setForm(initial)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return
    const payload: Record<string, unknown> = {}
    for (const f of fields) {
      const raw = form[f.key]
      if (f.type === 'number') payload[f.key] = Number(raw)
      else payload[f.key] = raw
    }
    if (editing) {
      const { error: err } = await supabase.from(table).update(payload).eq('id', editing.id)
      if (err) {
        setError(err.message)
        return
      }
    } else {
      const { error: err } = await supabase.from(table).insert([payload])
      if (err) {
        setError(err.message)
        return
      }
    }
    setModalOpen(false)
    setEditing(null)
    await fetchRows()
    onMutate?.()
  }

  async function handleDelete(id: string) {
    if (!canEdit || !confirm('Delete this item?')) return
    const { error: err } = await supabase.from(table).delete().eq('id', id)
    if (err) setError(err.message)
    else {
      await fetchRows()
      onMutate?.()
    }
  }

  return (
    <section className="studio-crud">
      <div className="studio-crud__head">
        <h2 className="studio-crud__title">{title}</h2>
        {canEdit && !authLoading ? (
          <button type="button" className="studio-crud__add" onClick={openCreate}>
            <Plus size={16} aria-hidden />
            Add
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="studio-crud__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="studio-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="studio-muted">{emptyLabel}</p>
      ) : (
        <ul className="studio-crud__list">
          {rows.map((row) => (
            <li key={row.id} className="studio-crud__row">
              <div className="studio-crud__row-body">{renderRow(row)}</div>
              {canEdit ? (
                <div className="studio-crud__row-actions">
                  <button type="button" className="studio-crud__icon-btn" aria-label="Edit" onClick={() => openEdit(row)}>
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="studio-crud__icon-btn studio-crud__icon-btn--danger"
                    aria-label="Delete"
                    onClick={() => void handleDelete(row.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {modalOpen && canEdit ? (
        <div className="studio-crud__overlay" role="presentation" onClick={() => setModalOpen(false)}>
          <form
            className="studio-crud__modal"
            onSubmit={(e) => void handleSubmit(e)}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="studio-crud__modal-title">{editing ? 'Edit' : 'Add'} {title}</h3>
            {fields.map((f) => (
              <label key={f.key} className="studio-crud__field">
                <span>{f.label}</span>
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                  value={form[f.key] ?? ''}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  required
                />
              </label>
            ))}
            <div className="studio-crud__modal-actions">
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="studio-btn">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
