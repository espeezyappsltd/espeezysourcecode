'use client'

import { useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT, TABLET_BREAKPOINT } from '@/lib/list/viewport-list'

type Options = {
  mobile?: number
  tablet?: number
  desktop?: number
}

export function useMediaColumnCount(opts: Options = {}) {
  const { mobile = 2, tablet = 3, desktop = 4 } = opts
  const [count, setCount] = useState(desktop)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w <= MOBILE_BREAKPOINT) setCount(mobile)
      else if (w <= TABLET_BREAKPOINT) setCount(tablet)
      else setCount(desktop)
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [mobile, tablet, desktop])

  return count
}
