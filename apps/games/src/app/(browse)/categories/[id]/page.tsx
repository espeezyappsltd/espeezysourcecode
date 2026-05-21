'use client'

import { useParams } from 'next/navigation'
import CategoryGamesView from '@/components/catalog/CategoryGamesView'

export default function CategoryPage() {
  const { id } = useParams()
  return <CategoryGamesView categoryId={id as string} />
}
