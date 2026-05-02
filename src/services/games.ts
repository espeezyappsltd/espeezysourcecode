export type GameCategory = {
  id: string
  slug: string
  name: string
  description?: string | null
  icon?: string | null
  difficulty_tier: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary'
  prize_pool_cents: number
  is_seasonal: boolean
  season_start?: string | null
  season_end?: string | null
}

export async function fetchGameCategories(): Promise<GameCategory[]> {
  const res = await fetch('/api/games/categories', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch game categories')
  const json = await res.json()
  return (json.categories ?? []) as GameCategory[]
}

export async function startGameSession(input: {
  categorySlug: string
  questionCount?: number
  guestName?: string
}) {
  const res = await fetch('/api/games/sessions/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Failed to start session')
  return json
}

export async function answerGameQuestion(input: {
  sessionId: string
  questionId: string
  answer: 'a' | 'b' | 'c' | 'd'
  accessToken?: string
  timeTakenMs?: number
}) {
  const res = await fetch(`/api/games/sessions/${input.sessionId}/answer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      questionId: input.questionId,
      answer: input.answer,
      accessToken: input.accessToken,
      timeTakenMs: input.timeTakenMs,
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Failed to submit answer')
  return json
}

export async function fetchGameSummary(sessionId: string, accessToken?: string) {
  const query = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : ''
  const res = await fetch(`/api/games/sessions/${sessionId}/summary${query}`, { cache: 'no-store' })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Failed to fetch summary')
  return json
}
