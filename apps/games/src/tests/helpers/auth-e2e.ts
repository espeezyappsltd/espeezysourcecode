import * as fs from 'fs'
import * as path from 'path'
import type { Page } from '@playwright/test'

export type SupabaseAdminConfig = {
  url: string
  serviceRole: string
}

export function loadEnvLocal(cwd: string): Record<string, string> {
  const envPath = path.join(cwd, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf-8')
      .split('\n')
      .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=')
        const key = line.slice(0, idx).trim()
        const value = line
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, '')
        return [key, value]
      }),
  )
}

export function getSupabaseAdminConfig(cwd: string): SupabaseAdminConfig | null {
  const env = { ...process.env, ...loadEnvLocal(cwd) }
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRole = (env.SUPABASE_SERVICE_ROLE_KEY ?? env.SECRET_KEY)?.trim()
  if (!url || !serviceRole || url.includes('mock')) return null
  return { url: url.replace(/\/$/, ''), serviceRole }
}

export function uniqueTestEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@e2e.espeezy.test`
}

export async function waitForLoginGate(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const gate = document.querySelector('[data-login-auth-gate]')
      if (!gate) return true
      return gate.getAttribute('data-ready') === 'true'
    },
    { timeout: 45_000 },
  )
}

function adminHeaders(serviceRole: string): Record<string, string> {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    'Content-Type': 'application/json',
  }
}

export async function deleteUserByEmail(config: SupabaseAdminConfig, email: string): Promise<void> {
  const userId = await findUserIdByEmail(config, email)
  if (!userId) return
  await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: adminHeaders(config.serviceRole),
  })
}

async function findUserIdByEmail(config: SupabaseAdminConfig, email: string): Promise<string | null> {
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

export async function confirmUserByEmail(config: SupabaseAdminConfig, email: string): Promise<void> {
  const userId = await findUserIdByEmail(config, email)
  if (!userId) throw new Error(`User not found for confirmation: ${email}`)
  const res = await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders(config.serviceRole),
    body: JSON.stringify({ email_confirm: true }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to confirm user: ${text}`)
  }
}

export async function grantGamesProAccess(config: SupabaseAdminConfig, email: string): Promise<void> {
  const userId = await findUserIdByEmail(config, email)
  if (!userId) throw new Error(`User not found for tier grant: ${email}`)

  await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders(config.serviceRole),
    body: JSON.stringify({ app_metadata: { tier: 'pro' } }),
  })

  const res = await fetch(`${config.url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      ...adminHeaders(config.serviceRole),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ tier: 'pro' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to set games tier: ${text}`)
  }
}

export async function generateRecoveryLink(
  config: SupabaseAdminConfig,
  email: string,
  redirectTo: string,
): Promise<string> {
  const res = await fetch(`${config.url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: adminHeaders(config.serviceRole),
    body: JSON.stringify({
      type: 'recovery',
      email,
      options: { redirect_to: redirectTo },
    }),
  })
  const body = (await res.json()) as { action_link?: string; properties?: { action_link?: string } }
  if (!res.ok) {
    throw new Error(`generate_link failed: ${JSON.stringify(body)}`)
  }
  const link = body.action_link ?? body.properties?.action_link
  if (!link) throw new Error('No recovery action_link in response')
  return link
}
