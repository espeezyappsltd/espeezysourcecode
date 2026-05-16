import type { SupabaseClient } from '@supabase/supabase-js'

const KNOWN_ROLES = ['admin', 'user', 'student', 'teacher', 'moderator', 'banned'] as const

export async function fetchRoleCounts(svc: SupabaseClient): Promise<Record<string, number>> {
  const counts = await Promise.all(
    KNOWN_ROLES.map(async (role) => {
      const { count, error } = await svc
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', role)
      if (error) throw error
      return count ?? 0
    }),
  )
  return Object.fromEntries(KNOWN_ROLES.map((role, i) => [role, counts[i]]))
}

export async function fetchPlanCounts(svc: SupabaseClient): Promise<Record<string, number>> {
  const countFree = async () => {
    const { count, error } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('subscription_plan.eq.free,subscription_plan.is.null')
    if (error) throw error
    return count ?? 0
  }
  const countPlan = async (plan: string) => {
    const { count, error } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_plan', plan)
    if (error) throw error
    return count ?? 0
  }

  const [free, pro, premium, lifetime] = await Promise.all([
    countFree(),
    countPlan('pro'),
    countPlan('premium'),
    countPlan('lifetime'),
  ])
  return { free, pro, premium, lifetime }
}

export async function fetchSignupChart(
  svc: SupabaseClient,
  days = 30,
): Promise<Array<{ date: string; count: number }>> {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const ranges = Array.from({ length: days }, (_, i) => {
    const end = new Date(now.getTime() - i * dayMs)
    end.setUTCHours(0, 0, 0, 0)
    const start = new Date(end.getTime() - dayMs)
    return {
      date: end.toISOString().split('T')[0],
      start: start.toISOString(),
      end: end.toISOString(),
    }
  })

  const counts = await Promise.all(
    ranges.map(async ({ start, end }) => {
      const { count, error } = await svc
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end)
      if (error) throw error
      return count ?? 0
    }),
  )

  return ranges
    .map((r, i) => ({ date: r.date, count: counts[i] }))
    .reverse()
}
