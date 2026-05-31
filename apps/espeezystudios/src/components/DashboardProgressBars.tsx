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
            { key: 'value', label: 'Percent (0-100)', type: 'number', min: 0, max: 100 },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
          ]}
          emptyLabel="No progress metrics yet. Add one above to track pipeline completion."
          buildEmpty={() => ({ label: '', value: 0, color: '#6366f1', sort_order: 0 })}
          renderRow={(p) => (
            <span>
              {p.label}: {p.value}%
            </span>
          )}
          onMutate={() => void fetchItems()}
        />
      ) : null}

      {loading ? (
        <p className="studio-muted">Loading progress…</p>
      ) : (
        <div className="studio-dashboard-progress">
          {items.map((p) => (
            <div key={p.id} className="studio-dashboard-progress__item">
              <div className="studio-dashboard-progress__label">{p.label}</div>
              <div className="studio-dashboard-progress__track">
                <div
                  className="studio-dashboard-progress__fill"
                  style={{
                    width: `${p.value}%`,
                    background: p.color,
                  }}
                />
              </div>
              <div className="studio-dashboard-progress__value" style={{ color: p.color }}>
                {p.value}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
