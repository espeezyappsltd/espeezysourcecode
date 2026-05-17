'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Reset main pane scroll on route change so users can always reach the top. */
export function useMainContentScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    const main = document.querySelector<HTMLElement>('.main-content')
    if (!main) return
    main.scrollTo({ top: 0, left: 0 })
  }, [pathname])
}

export default function MainContentScroll() {
  useMainContentScrollToTop()
  return null
}
