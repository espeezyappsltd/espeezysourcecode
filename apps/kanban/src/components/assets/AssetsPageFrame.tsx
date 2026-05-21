'use client'

import type { ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type AssetsPageFrameProps = {
  children: ReactNode
  /** Visually hidden live region for loading / error announcements */
  statusMessage?: string | null
  statusRole?: 'status' | 'alert'
}

/**
 * Shared shell: skip link, single main landmark, optional live status (WCAG 2.4.1, 4.1.3).
 */
export function AssetsPageFrame({
  children,
  statusMessage,
  statusRole = 'status',
}: AssetsPageFrameProps) {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <>
      <a href="#assets-main-content" className="assets-skip-link">
        Skip to Personal Arsenal content
      </a>
      {statusMessage ? (
        <p
          className="sr-only"
          role={statusRole}
          aria-live={statusRole === 'alert' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {statusMessage}
        </p>
      ) : null}
      <main
        id="assets-main-content"
        className={reduceMotion ? 'assets-page--reduce-motion' : undefined}
        tabIndex={-1}
      >
        {children}
      </main>
    </>
  )
}
