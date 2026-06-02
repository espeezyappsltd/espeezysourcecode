'use client'

import type { ReactNode } from 'react'
import ProcessedDataLoadingView from './ProcessedDataLoadingView'
import { isProcessedDataRoute } from './processed-data-routes'
import { useProcessedDataNavLoading } from './useProcessedDataNavLoading'

type Props = {
  children: ReactNode
  matchPath?: (pathname: string) => boolean
  minDurationMs?: number
  /** inline = overlay within a positioned parent; fixed = full viewport */
  scope?: 'inline' | 'fixed'
}

export default function ProcessedDataNavigationLoader({
  children,
  matchPath = isProcessedDataRoute,
  minDurationMs,
  scope = 'inline',
}: Props) {
  const visible = useProcessedDataNavLoading(matchPath, minDurationMs)

  return (
    <>
      {children}
      {visible ? <ProcessedDataLoadingView scope={scope} /> : null}
    </>
  )
}
