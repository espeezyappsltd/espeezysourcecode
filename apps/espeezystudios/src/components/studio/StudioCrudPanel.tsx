'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pencil, Plus, Settings, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudioEditor } from '@/hooks/useStudioEditor'

export type CrudFieldType =
  | 'text'
  | 'number'
  | 'url'
  | 'color'
  | 'email'
  | 'textarea'
  | 'select'
  | 'datetime'

export type CrudField<T> = {
  key: keyof T & string
  label: string
  type?: CrudFieldType
  placeholder?: string
  min?: number
  max?: number
  required?: boolean
  options?: { value: string; label: string }[]
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
  gearToggle?: boolean
  gearLabel?: string
  mapInsert?: (payload: Record<string, unknown>) => Record<string, unknown>
  mapUpdate?: (payload: Record<string, unknown>, row: T) => Record<string, unknown>
  onAfterCreate?: (row: T) => void | Promise<void>
  deleteConfirmMessage?: string
}

function fieldToFormValue<T>(row: T | Omit<T, 'id'>, field: CrudField<T>): string | number {
  const v = (row as Record<string, unknown>)[field.key]
  if (field.type === 'datetime' && typeof v === 'string' && v) {
    return v.slice(0, 16)
  }
  if (field.type === 'number') return typeof v === 'number' ? v : Number(v ?? 0)
  return String(v ?? '')
}

function formToPayload<T>(fields: CrudField<T>[], form: Record<string, string | number>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const f of fields) {
    const raw = form[f.key]
    if (f.type === 'number') {
      payload[f.key] = Number(raw)
    } else if (f.type === 'datetime') {
      payload[f.key] = raw ? new Date(String(raw)).toISOString() : null
    } else {
      const str = String(raw ?? '')
      payload[f.key] = f.required === false && str === '' ? null : str
    }
  }
  return payload
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
  gearToggle = false,
  gearLabel = 'Settings',
  mapInsert,
  mapUpdate,
  onAfterCreate,
  deleteConfirmMessage = 'Delete this item?',
}: Props<T>) {
  const { canEdit, loading: authLoading } = useStudioEditor()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, string | number>>({})
  const [gearOpen, setGearOpen] = useState(false)

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
      initial[f.key] = fieldToFormValue(empty, f)
    }
    setEditing(null)
    setForm(initial)
    setModalOpen(true)
  }

  function openEdit(row: T) {
    const initial: Record<string, string | number> = {}
    for (const f of fields) {
      initial[f.key] = fieldToFormValue(row, f)
    }
    setEditing(row)
    setForm(initial)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return
    let payload = formToPayload(fields, form)
    if (editing) {
      payload = mapUpdate ? mapUpdate(payload, editing) : payload
      const { error: err } = await supabase.from(table).update(payload).eq('id', editing.id)
      if (err) {
        setError(err.message)
        return
      }
    } else {
      payload = mapInsert ? mapInsert(payload) : payload
      const { data, error: err } = await supabase.from(table).insert([payload]).select('*').single()
      if (err) {
        setError(err.message)
        return
      }
      if (data && onAfterCreate) {
        await onAfterCreate(data as T)
      }
    }
    setModalOpen(false)
    setEditing(null)
    await fetchRows()
    onMutate?.()
  }

  async function handleDelete(id: string) {
    if (!canEdit || !confirm(deleteConfirmMessage)) return
    const { error: err } = await supabase.from(table).delete().eq('id', id)
    if (err) setError(err.message)
    else {
      await fetchRows()
      onMutate?.()
    }
  }

  const panelVisible = !gearToggle || gearOpen

  return (
    <section className={`studio-crud${gearToggle ? ' studio-crud--gear' : ''}${gearOpen ? ' studio-crud--open' : ''}`}>
      {gearToggle && canEdit && !authLoading ? (
        <div className="studio-crud__gear-bar">
          <button
            type="button"
            className={`studio-crud__gear${gearOpen ? ' is-active' : ''}`}
            aria-expanded={gearOpen}
            aria-controls={`studio-crud-panel-${table}`}
            onClick={() => setGearOpen((open) => !open)}
          >
            <Settings size={18} aria-hidden />
            <span>{gearLabel}</span>
          </button>
          {gearOpen ? (
            <button
              type="button"
              className="studio-crud__gear-close"
              aria-label="Close settings"
              onClick={() => setGearOpen(false)}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

      {panelVisible ? (
        <div id={`studio-crud-panel-${table}`} className="studio-crud__panel">
          <div className="studio-crud__head">
            <h2 className="studio-crud__title">{gearToggle ? `${gearLabel}` : title}</h2>
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
        </div>
      ) : null}

      {modalOpen && canEdit ? (
        <div className="studio-crud__overlay" role="presentation" onClick={() => setModalOpen(false)}>
          <form
            className="studio-crud__modal"
            onSubmit={(e) => void handleSubmit(e)}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="studio-crud__modal-title">
              {editing ? 'Edit' : 'Add'} {title}
            </h3>
            {fields.map((f) => (
              <label key={f.key} className="studio-crud__field">
                <span>{f.label}</span>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ''}
                    placeholder={f.placeholder}
                    required={f.required !== false}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={String(form[f.key] ?? '')}
                    required={f.required !== false}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    {(f.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      f.type === 'number'
                        ? 'number'
                        : f.type === 'url'
                          ? 'url'
                          : f.type === 'email'
                            ? 'email'
                            : f.type === 'datetime'
                              ? 'datetime-local'
                              : 'text'
                    }
                    value={form[f.key] ?? ''}
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                    required={f.required !== false}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
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
