import type { SupabaseAdminConfig } from './auth-e2e'

function adminHeaders(serviceRole: string): Record<string, string> {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

export async function adminRest<T>(
  config: SupabaseAdminConfig,
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const qs = options.query
    ? `?${new URLSearchParams(options.query).toString()}`
    : ''
  const res = await fetch(`${config.url}/rest/v1/${path}${qs}`, {
    method: options.method ?? 'GET',
    headers: adminHeaders(config.serviceRole),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Supabase REST ${path}: ${res.status} ${text}`)
    ;(err as Error & { status: number }).status = res.status
    throw err
  }
  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

export async function resetUserOnboarding(
  config: SupabaseAdminConfig,
  userId: string,
  groupId: string,
): Promise<void> {
  const tasks = await adminRest<{ id: string; description: string | null; assignees: string[] | null }[]>(
    config,
    'tasks',
    {
      query: {
        select: 'id,description,assignees',
        group_id: `eq.${groupId}`,
      },
    },
  )

  const onboardingIds = tasks
    .filter(
      (t) =>
        t.description?.includes('[espeezy-onboarding:') &&
        (t.assignees ?? []).includes(userId),
    )
    .map((t) => t.id)

  if (onboardingIds.length > 0) {
    await adminRest(config, 'tasks', {
      method: 'DELETE',
      query: { id: `in.(${onboardingIds.join(',')})` },
    })
  }

  try {
    const assets = await adminRest<{ id: string; metadata: { storage_path?: string } | null }[]>(
      config,
      'personal_assets',
      {
        query: {
          select: 'id,metadata',
          user_id: `eq.${userId}`,
          title: 'eq.Onboarding Check Complete Report.txt',
        },
      },
    )

    for (const asset of assets) {
      const storagePath = asset.metadata?.storage_path
      if (storagePath) {
        await fetch(`${config.url}/storage/v1/object/user-assets/${storagePath}`, {
          method: 'DELETE',
          headers: adminHeaders(config.serviceRole),
        })
      }
      await adminRest(config, 'personal_assets', {
        method: 'DELETE',
        query: { id: `eq.${asset.id}` },
      })
    }
  } catch (err) {
    const status = (err as Error & { status?: number }).status
    if (status !== 404) throw err
  }

  try {
    await adminRest(config, 'profiles', {
      method: 'PATCH',
      query: { id: `eq.${userId}` },
      body: {
        onboarding_completed_at: null,
        onboarding_reward_claimed: false,
      },
    })
  } catch {
    /* columns may not exist on older DB snapshots */
  }

  try {
    await adminRest(config, 'notifications', {
      method: 'DELETE',
      query: { user_id: `eq.${userId}`, type: 'eq.onboarding_complete' },
    })
  } catch {
    /* ignore */
  }
}

export async function getProfileCredits(
  config: SupabaseAdminConfig,
  userId: string,
): Promise<number> {
  const rows = await adminRest<{ espeezy_credits: number }[]>(config, 'profiles', {
    query: { select: 'espeezy_credits', id: `eq.${userId}` },
  })
  return rows[0]?.espeezy_credits ?? 0
}

export async function findUserIdByEmail(
  config: SupabaseAdminConfig,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${config.url}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: adminHeaders(config.serviceRole),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { users?: { id: string; email?: string }[] }
    const match = body.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (!body.users?.length || body.users.length < 200) break
  }
  return null
}
