import type { ChilloutUserStats } from './types'

type DbGameStats = {
  total_points?: number | null
  total_games?: number | null
  wins?: number | null
}

export function deriveLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / 100) + 1)
}

export function deriveRankTitle(level: number): string {
  if (level >= 10) return 'Grandmaster Scholar'
  if (level >= 7) return 'Elite Strategist'
  if (level >= 4) return 'Rising Analyst'
  return 'Novice Scholar'
}

export function mapDbStatsToView(stats: DbGameStats): ChilloutUserStats {
  const total_xp = stats.total_points ?? 0
  const level = deriveLevel(total_xp)
  return {
    level,
    total_xp,
    wins: stats.wins ?? 0,
    games_played: stats.total_games ?? 0,
    rank_title: deriveRankTitle(level),
  }
}

export function defaultGameStatsPayload(userId: string) {
  return {
    user_id: userId,
    total_points: 0,
    total_games: 0,
    wins: 0,
    losses: 0,
    current_streak: 0,
    best_streak: 0,
  }
}
