import type { Category, Game } from './games'

export type GameWithCategory = Game & {
  category: string
  categoryId: string
}

export type CategoriesWithGamesResponse = Category[]
