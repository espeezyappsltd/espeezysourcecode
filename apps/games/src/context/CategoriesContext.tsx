'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useCategoriesWithGames } from '@/hooks/useCategoriesWithGames'
import type { Category } from '@/types/games'

type CategoriesContextValue = {
  categories: Category[]
  loading: boolean
  error: string | null
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const value = useCategoriesWithGames()
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}

export function useCategoriesContext(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext)
  if (!ctx) {
    throw new Error('useCategoriesContext must be used within CategoriesProvider')
  }
  return ctx
}
