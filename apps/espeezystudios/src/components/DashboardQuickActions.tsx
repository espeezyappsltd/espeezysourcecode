'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, UserPlus, BarChart3, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'
import { useStudioEditor } from '@/hooks/useStudioEditor'

type QuickAction = {
  id: string
  label: string
  href: string
  sort_order: number
}

const ICONS = [Plus, BarChart3, UserPlus, Briefcase]

export default function DashboardQuickActions() {
  const [actions, setActions] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(true)
  const { canEdit } = useStudioEditor()

  const fetchActions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('studio_quick_actions')
      .select('*')
      .order('sort_order', { ascending: true })
    setActions((data ?? []) as QuickAction[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchActions()
  }, [fetchActions])

  return (
    <div>
      {canEdit ? (
        <StudioCrudPanel<QuickAction>
          table="studio_quick_actions"
          title="quick action"
          fields={[
            { key: 'label', label: 'Label' },
            { key: 'href', label: 'Link path', type: 'url' },
            { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
          ]}
          emptyLabel="No quick actions yet. Add shortcuts your team uses daily."
          buildEmpty={() => ({ label: '', href: '/', sort_order: 0 })}
          renderRow={(a) => (
            <span>
              {a.label} → {a.href}
            </span>
          )}
          onMutate={() => void fetchActions()}
        />
      ) : null}

      {loading ? (
        <p className="studio-muted">Loading actions…</p>
      ) : (
        <div className="studio-quick-actions">
          {actions.map((a, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Link key={a.id} href={a.href} className="studio-quick-actions__btn">
                <Icon size={20} />
                <span>{a.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
