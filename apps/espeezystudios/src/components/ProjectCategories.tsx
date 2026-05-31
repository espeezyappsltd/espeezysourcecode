'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { STUDIO_NOT_SET } from '@/lib/studio/ui-copy'
import { useStudioEditor } from '@/hooks/useStudioEditor'
import { StudioProjectsCrudPanel } from '@/components/studio/StudioProjectsCrudPanel'
import type { StudioProject } from '@/lib/studio/studio-project'

export type { StudioProject }

const STATUS_OPTIONS = ['Ongoing', 'Finished', '£££'] as const

export default function ProjectCategories() {
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [loading, setLoading] = useState(true)
  const { canEdit } = useStudioEditor()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('studio_projects')
      .select('*')
      .order('sort_order', { ascending: true })
    setProjects((data ?? []) as StudioProject[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  const byStatus = STATUS_OPTIONS.map((status) => ({
    status,
    items: projects.filter((p) => p.status === status),
  }))

  return (
    <div className="studio-projects">
      {canEdit ? <StudioProjectsCrudPanel onMutate={() => void fetchProjects()} /> : null}

      <section id="projects" className="section" aria-labelledby="projects-heading">
        <h2 id="projects-heading">Project Categories</h2>
        {loading ? (
          <p className="studio-muted">Loading studio projects…</p>
        ) : (
          <div className="card-grid">
            {byStatus.map((cat) => {
              const color = cat.items[0]?.status_color ?? '#6366f1'
              const symbol = cat.items[0]?.symbol ?? '•'
              return (
                <div key={cat.status}>
                  <h3 className="category__heading" style={{ color }}>
                    <span aria-hidden="true">{symbol} </span>
                    {cat.status}
                  </h3>
                  <ul className="category__list">
                    {cat.items.length === 0 ? (
                      <li className="studio-muted">{STUDIO_NOT_SET}</li>
                    ) : (
                      cat.items.map((p) => <li key={p.id}>{p.title}</li>)
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
