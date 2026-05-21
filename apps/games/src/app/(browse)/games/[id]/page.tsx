'use client'

import { useParams } from 'next/navigation'
import GameDetailView from '@/components/catalog/GameDetailView'

export default function GamePage() {
  const { id } = useParams()
  return <GameDetailView gameId={id as string} />
}
