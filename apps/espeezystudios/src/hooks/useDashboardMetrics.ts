import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState({
    projects: 0,
    jobs: 0,
    team: 0,
    completed: 0,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    async function fetchMetrics() {
      const [jobsRes, projectsRes, teamRes] = await Promise.all([
        supabase.from('jobs').select('status'),
        supabase.from('studio_projects').select('id'),
        supabase.from('studio_team_members').select('id'),
      ])

      type JobRow = { status: string }
      const jobs = (jobsRes.data ?? []) as JobRow[]
      const completed = jobs.filter((j) => j.status === 'done').length
      const active = jobs.filter((j) => j.status !== 'done').length

      if (mounted) {
        setMetrics({
          projects: projectsRes.data?.length ?? 0,
          jobs: active,
          team: teamRes.data?.length ?? 0,
          completed,
          loading: false,
        })
      }
    }
    void fetchMetrics()
    return () => {
      mounted = false
    }
  }, [])

  return metrics
}
