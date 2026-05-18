import { Q } from '@/lib/query-columns'
import { resolveTaskPayoutCredits } from '@/lib/hustle/credits'
import { validateHustleTaskRow, type HustleTaskRow } from '@/lib/hustle/task-validation'

type ProfileCard = {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  role: string | null
}

export type HustleTaskWithProfiles = HustleTaskRow & {
  payout_credits: number
  poster: ProfileCard | null
  assignee: ProfileCard | null
}

export async function enrichHustleTasks(
  adminDb: ReturnType<typeof import('@/lib/supabase/admin').getAdminDb>,
  rows: unknown[],
): Promise<HustleTaskWithProfiles[]> {
  const validated = rows
    .map((row) => validateHustleTaskRow(row))
    .filter((row): row is HustleTaskRow => row !== null)

  const profileIds = Array.from(
    new Set(validated.flatMap((row) => [row.poster_id, row.assignee_id]).filter(Boolean) as string[]),
  )

  const { data: profiles } =
    profileIds.length > 0
      ? await adminDb.from('profiles').select(Q.profile.card).in('id', profileIds)
      : { data: [] as ProfileCard[] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p as ProfileCard]))

  return validated.map((data) => ({
    ...data,
    payout_credits: resolveTaskPayoutCredits(data),
    poster: profileMap.get(data.poster_id) ?? null,
    assignee: data.assignee_id ? profileMap.get(data.assignee_id) ?? null : null,
  }))
}
