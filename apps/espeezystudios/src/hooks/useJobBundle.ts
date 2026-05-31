'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { JobBundle } from '@/lib/jobs/types'

export function useJobBundle(jobId: string | null) {
  const [bundle, setBundle] = useState<JobBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!jobId) {
      setBundle(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data: job, error: jobErr } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle()
    if (jobErr || !job) {
      setError(jobErr?.message ?? 'Job not found')
      setBundle(null)
      setLoading(false)
      return
    }

    const [milestones, budgetEntries, timeline, deliveryLogs] = await Promise.all([
      supabase.from('studio_job_milestones').select('*').eq('job_id', jobId).order('sort_order'),
      supabase.from('studio_job_budget_entries').select('*').eq('job_id', jobId).order('entry_date', { ascending: false }),
      supabase.from('studio_job_timeline_events').select('*').eq('job_id', jobId).order('event_at', { ascending: false }),
      supabase.from('studio_job_delivery_logs').select('*').eq('job_id', jobId).order('sent_at', { ascending: false }),
    ])

    setBundle({
      job,
      milestones: milestones.data ?? [],
      budgetEntries: budgetEntries.data ?? [],
      timeline: timeline.data ?? [],
      deliveryLogs: deliveryLogs.data ?? [],
    })
    setLoading(false)
  }, [jobId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!jobId) return
    const channel = supabase
      .channel(`job-${jobId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` }, () => void refresh())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [jobId, refresh])

  return { bundle, loading, error, refresh }
}
