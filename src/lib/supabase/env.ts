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
    process.env.SUPABASE_URL,
  ])
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  return url
}

export function resolveSupabaseAnonKey(): string {
  const key = pickFirstNonEmpty([
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
  ])
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

export function resolveSupabaseServiceRoleKey(): string {
  const key = pickFirstNonEmpty([
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SECRET_KEY,
  ])
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return key
}
