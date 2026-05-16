'use client'

import { useEffect, useRef, useState } from 'react'
import { useCentralLoading } from '@shared/CentralLoadingProvider'
import { usePathname } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    // Path changed - stop any running animation and flash complete
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setWidth(100)
    timerRef.current = setTimeout(() => setVisible(false), 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  // On mount, listen for clicks on <a> tags to start the bar
  const { startLoading } = useCentralLoading();
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      // Only internal same-origin links
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return

      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      setVisible(true)
      setWidth(0)

      // Animate to ~85% quickly then slow down
      let current = 0
      const tick = () => {
        current += current < 50 ? 4 : current < 75 ? 1.5 : 0.3
        if (current < 90) {
          setWidth(current)
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)

      // Trigger central loader for high-end feel
      startLoading('Navigating...')
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [startLoading])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
        zIndex: 9999,
        transition: width === 100 ? 'width 0.2s ease, opacity 0.3s ease' : 'width 0.15s ease',
        opacity: width === 100 ? 0 : 1,
        borderRadius: '0 2px 2px 0',
        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
      }}
    />
  )
}
