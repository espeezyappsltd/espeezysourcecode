'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isProcessedDataRoute } from './processed-data-routes'

const DEFAULT_MIN_MS = 520

export function useProcessedDataNavLoading(
  matchPath: (pathname: string) => boolean = isProcessedDataRoute,
  minDurationMs = DEFAULT_MIN_MS,
) {
  const pathname = usePathname() ?? '/'
  const [visible, setVisible] = useState(false)
  const hideAtRef = useRef(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideAtRef.current = Date.now() + minDurationMs
    setVisible(true)
  }, [minDurationMs])

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    const delay = Math.max(0, hideAtRef.current - Date.now())
    hideTimerRef.current = setTimeout(() => {
      setVisible(false)
      hideTimerRef.current = null
    }, delay)
  }, [])

  useEffect(() => {
    if (!matchPath(pathname)) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setVisible(false)
      return
    }
    show()
    scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [pathname, matchPath, show, scheduleHide])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
        if (matchPath(url.pathname)) show()
      } catch {
        /* ignore malformed href */
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [matchPath, show])

  return visible
}
