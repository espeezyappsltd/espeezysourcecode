import type { LucideIcon } from 'lucide-react'
import type { QuizQuestion } from '@/types/quiz'

export type ChilloutDifficulty = 'Easy' | 'Medium' | 'Hard'
export type ChilloutGameMode = 'Speed Recall' | 'AI Evaluated'
export type ChilloutStep = 1 | 2 | 3 | 4

export type ChilloutTopic = {
  id: string
  name: string
  icon: LucideIcon
  color: string
  description: string
}

export type ChilloutUserStats = {
  level: number
  total_xp: number
  wins: number
  games_played: number
  rank_title: string
}

export type ChilloutHubState = {
  step: ChilloutStep
  selectedTopic: ChilloutTopic | null
  difficulty: ChilloutDifficulty
  gameMode: ChilloutGameMode
  roundCount: number
  isGenerating: boolean
  questions: QuizQuestion[]
  selectedPlayers: string[]
  userStats: ChilloutUserStats | null
}
