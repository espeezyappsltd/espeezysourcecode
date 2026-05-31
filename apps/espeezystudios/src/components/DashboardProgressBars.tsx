'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'
import { useStudioEditor } from '@/hooks/useStudioEditor'

type ProgressItem = {
  id: string
  label: string
  value: number
  color: string
  sort_order: number
}

export default function DashboardProgressBars() {
  const [items, setItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const { canEdit } = useStudioEditor()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('studio_progress_items')
      .select('*')
      .order('sort_order', { ascending: true })
    setItems((data ?? []) as ProgressItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  return (
    <div>
      {canEdit ? (
        <StudioCrudPanel<ProgressItem>
          table="studio_progress_items"
          title="progress metric"
          fields={[
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Percent (0–100)', type: 'number', min: 0, max: 100 },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
          ]}
          emptyLabel="No progress metrics."
          buildEmpty={() => ({ label: '', value: 0, color: '#6366f1', sort_order: 0 })}
          renderRow={(p) => (
            <span>
              {p.label} — {p.value}%
            </span>
          )}
          onMutate={() => void fetchItems()}
        />
      ) : null}

      {loading ? (
        <p className="studio-muted">Loading progress…</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.2rem',
            margin: '0 0 2.5rem 0',
            width: '100%',
            maxWidth: 900,
          }}
        >
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--studios-surface-2)',
                borderRadius: 14,
                padding: '1.1rem 1.2rem',
                boxShadow: '0 1px 8px rgba(15,23,42,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--studios-muted)' }}>{p.label}</div>
              <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${p.value}%`,
                    height: '100%',
                    background: p.color,
                    borderRadius: 6,
                    transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
                  }}
                />
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: p.color }}>{p.value}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
