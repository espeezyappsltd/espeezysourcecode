'use client'

import { usePathname } from 'next/navigation'
import { getGuideForPath } from '@/lib/page-guides'
import { PageGuide } from './PageGuide'

export function PageGuideHost() {
  const pathname = usePathname()
  const guide = getGuideForPath(pathname)
  if (!guide) return null
  return <PageGuide guide={guide} />
}
