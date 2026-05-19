'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/** Debounce before API fetch (hooks). */
export const LIST_SEARCH_DEBOUNCE_MS = 220
/** Debounce before writing `q` to the URL (shareable links / back-forward). */
export const LIST_URL_DEBOUNCE_MS = 280

type Options = {
  searchParams: ReadonlyURLSearchParams | null
  router: AppRouterInstance
  pathname: string
  committedQuery: string
  setCommittedQuery: (q: string) => void
  debounceMs?: number
}

/**
 * Instant draft input + debounced commit to fetch state and URL `q` param.
 * Avoids feedback loops when the URL was updated by this hook.
 */
export function useDebouncedListSearch({
  searchParams,
  router,
  pathname,
  committedQuery,
  setCommittedQuery,
  debounceMs = LIST_SEARCH_DEBOUNCE_MS,
}: Options) {
  const [draft, setDraft] = useState(() => searchParams?.get('q') ?? committedQuery)
  const lastPushedUrlQ = useRef(searchParams?.get('q') ?? committedQuery)
  const lastCommitted = useRef(committedQuery)

  useEffect(() => {
    const urlQ = searchParams?.get('q') ?? ''
    if (urlQ === lastPushedUrlQ.current) return
    lastPushedUrlQ.current = urlQ
    lastCommitted.current = urlQ
    setDraft(urlQ)
    if (urlQ !== committedQuery) setCommittedQuery(urlQ)
  }, [searchParams, committedQuery, setCommittedQuery])

  useEffect(() => {
    const trimmed = draft.trim()
    const timer = setTimeout(() => {
      if (trimmed !== lastCommitted.current) {
        lastCommitted.current = trimmed
        setCommittedQuery(trimmed)
      }

      const currentUrlQ = (searchParams?.get('q') ?? '').trim()
      if (trimmed === currentUrlQ) return

      const params = new URLSearchParams(searchParams?.toString() ?? '')
      if (trimmed) params.set('q', trimmed)
      else params.delete('q')
      const qs = params.toString()
      lastPushedUrlQ.current = trimmed
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [draft, debounceMs, pathname, router, searchParams, setCommittedQuery])

  const clear = useCallback(() => {
    setDraft('')
    lastCommitted.current = ''
    lastPushedUrlQ.current = ''
    setCommittedQuery('')
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete('q')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router, searchParams, setCommittedQuery])

  return { draft, setDraft, clear, hasDraft: draft.length > 0 }
}
