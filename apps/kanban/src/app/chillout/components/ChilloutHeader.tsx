'use client'

import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export function ChilloutHeader() {
  return (
    <PageHeader
      title="Chill Out"
      titleAccent="Zone"
      icon={Sparkles}
      description="Decompress and dominate with real-time academic skirmishes."
    />
  )
}
