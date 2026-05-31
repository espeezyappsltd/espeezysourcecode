type EnvValue = string | undefined

function pickFirstNonEmpty(values: EnvValue[]): string {
  for (const value of values) {
    const trimmed = (value ?? '').trim()
    if (trimmed) return trimmed
  }
  return ''
}

export function resolveSupabaseEnv() {
  const url = pickFirstNonEmpty([
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.PROJECT_URL,
    process.env.SUPABASE_URL,
  ])

  const anonKey = pickFirstNonEmpty([
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    process.env.PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
  ])

  return { url, anonKey }
}
