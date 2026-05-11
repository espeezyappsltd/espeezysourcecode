function pickFirstNonEmpty(values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

export function resolveSupabaseUrl(): string {
  const url = pickFirstNonEmpty([
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
    process.env.PROJECT_URL,
    process.env.SUPABASE_URL,
  ])

  if (!url) {
    throw new Error(
      'Missing Supabase URL: set NEXT_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_PROJECT_URL / PROJECT_URL).'
    )
  }

  return url
}

export function resolveSupabaseAnonKey(): string {
  const key = pickFirstNonEmpty([
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
  ])

  if (!key) {
    throw new Error(
      'Missing Supabase anon key: set NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY).'
    )
  }

  return key
}

export function resolveSupabaseServiceRoleKey(): string {
  const key = pickFirstNonEmpty([
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SECRET_KEY,
  ])

  if (!key) {
    throw new Error('Missing Supabase service role key: set SUPABASE_SERVICE_ROLE_KEY (or SECRET_KEY).')
  }

  return key
}