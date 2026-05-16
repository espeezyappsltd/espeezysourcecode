import * as fs from 'fs'
import * as path from 'path'

/** Match apps/kanban/src/lib/supabase/env.ts resolution order. */
export function loadTestEnv(): Record<string, string> {
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'apps', 'kanban', '.env.local'),
    path.join(process.cwd(), '.env'),
  ]

  const merged: Record<string, string> = {}
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue
    const parsed = Object.fromEntries(
      fs
        .readFileSync(envPath, 'utf-8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => {
          const idx = l.indexOf('=')
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
        }),
    )
    Object.assign(merged, parsed)
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) merged[key] = value
  }
  return merged
}

export function resolveSupabaseUrlFromEnv(env: Record<string, string>): string {
  return (
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
    env.PROJECT_URL ||
    env.SUPABASE_URL ||
    'https://rqazxvcanqiurjlrtkpz.supabase.co'
  ).trim()
}

export function resolveSupabaseAnonKeyFromEnv(env: Record<string, string>): string {
  return (
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    ''
  ).trim()
}

export function hasLiveSupabaseConfig(env: Record<string, string>): boolean {
  const url = resolveSupabaseUrlFromEnv(env)
  const key = resolveSupabaseAnonKeyFromEnv(env)
  return (
    url.includes('supabase.co') &&
    !url.includes('your-project') &&
    !url.includes('mock') &&
    Boolean(key) &&
    !key.includes('your-supabase')
  )
}
