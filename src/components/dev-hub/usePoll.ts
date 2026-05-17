'use client'

import { useEffect, useRef } from 'react'

export function usePoll(callback: () => void | Promise<void>, ms: number, enabled = true) {
  const saved = useRef(callback)
  saved.current = callback

  useEffect(() => {
    if (!enabled) return
    const tick = () => void saved.current()
    tick()
    const id = setInterval(tick, ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}
