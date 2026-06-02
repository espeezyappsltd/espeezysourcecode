'use client'

import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'
import type { StudioProject } from '@/lib/studio/studio-project'

const STATUS_OPTIONS = [
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Finished', label: 'Finished' },
  { value: '£££', label: '£££' },
]

type Props = {
  onMutate?: () => void
}

export function StudioProjectsCrudPanel({ onMutate }: Props) {
  return (
    <StudioCrudPanel<StudioProject>
      table="studio_projects"
      title="studio project"
      gearToggle
      gearLabel="Studio project settings"
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
        { key: 'status_color', label: 'Color', type: 'color' },
        { key: 'symbol', label: 'Symbol (emoji)' },
        { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
      ]}
      emptyLabel="No studio projects yet. Add one to organize delivery lanes."
      buildEmpty={() => ({
        title: '',
        status: 'Ongoing',
        status_color: '#2e7d32',
        symbol: '🟢',
        sort_order: 0,
      })}
      renderRow={(p) => (
        <>
          <span aria-hidden>{p.symbol} </span>
          {p.title}
          {' · '}
          <span style={{ color: p.status_color }}>{p.status}</span>
        </>
      )}
      onMutate={onMutate}
    />
  )
}
