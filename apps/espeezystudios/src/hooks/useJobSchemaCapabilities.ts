'use client'

import { useEffect, useState } from 'react'
import {
  getClientJobSchemaCapabilities,
  type JobSchemaCapabilities,
} from '@/lib/jobs/schema-capabilities'

export function useJobSchemaCapabilities() {
  const [capabilities, setCapabilities] = useState<JobSchemaCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getClientJobSchemaCapabilities()
      .then((caps) => {
        if (!cancelled) {
          setCapabilities(caps)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Schema check failed')
          setCapabilities(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { capabilities, loading, error }
}
