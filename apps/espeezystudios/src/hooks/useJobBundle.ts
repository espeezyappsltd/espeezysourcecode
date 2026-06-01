'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchJobRelatedData } from '@/lib/jobs/fetch-related'
import type { JobSchemaCapabilities } from '@/lib/jobs/schema-capabilities'
import type { JobBundle } from '@/lib/jobs/types'
import { supabase } from '@/lib/supabase-client'

export function useJobBundle(jobId: string | null, capabilities: JobSchemaCapabilities | null) {
  const [bundle, setBundle] = useState<JobBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!jobId) {
      setBundle(null)
      setLoading(false)
      return
    }
    if (!capabilities) {
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

    const related = await fetchJobRelatedData(supabase, jobId, capabilities)

    setBundle({
      job,
      ...related,
    })
    setLoading(false)
  }, [jobId, capabilities])

  useEffect(() => {
    if (!capabilities) return
    void refresh()
  }, [refresh, capabilities])

  useEffect(() => {
    if (!jobId || !capabilities) return
    const channel = supabase
      .channel(`job-${jobId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` }, () => void refresh())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [jobId, capabilities, refresh])

  return { bundle, loading, error, refresh }
}
