'use client'

import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'

export type AnalyticsKpi = {
  id: string
  label: string
  value: string
  hint: string | null
  sort_order: number
}

export default function StudioAnalyticsKpis() {
  return (
    <StudioCrudPanel<AnalyticsKpi>
      table="studio_analytics_kpis"
      title="KPI"
      fields={[
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
        { key: 'hint', label: 'Hint (optional)' },
        { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
      ]}
      emptyLabel="Add manual KPIs here; job charts below stay live from Supabase."
      buildEmpty={() => ({ label: '', value: '0', hint: '', sort_order: 0 })}
      renderRow={(k) => (
        <span>
          <strong>{k.label}</strong>: {k.value}
          {k.hint ? <span className="studio-muted"> — {k.hint}</span> : null}
        </span>
      )}
    />
  )
}
