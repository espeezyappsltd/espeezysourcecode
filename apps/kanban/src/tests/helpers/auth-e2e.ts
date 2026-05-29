import * as fs from 'fs'
import * as path from 'path'
import { expect, type Page } from '@playwright/test'

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

/** Wait until the login form is interactive. */
export async function waitForLoginGate(page: Page): Promise<void> {
  await page.locator('#auth-email').waitFor({ state: 'visible', timeout: 45_000 })
}

export async function isAdminApiAvailable(config: SupabaseAdminConfig): Promise<boolean> {
  try {
    const res = await fetch(`${config.url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: adminHeaders(config.serviceRole),
      signal: AbortSignal.timeout(12_000),
    })
    return res.ok
  } catch {
    return false
  }
}

const DISMISSED_PAGE_GUIDES = [
  'kanban',
  'feed',
  'hustle',
  'marketplace',
  'assets',
  'settings',
  'resources',
  'plans',
  'messages',
]

/** Close modals/overlays that block dashboard interactions in E2E. */
export async function dismissBlockingOverlays(page: Page): Promise<void> {
  await page.evaluate((guideIds) => {
    for (const id of guideIds) {
      localStorage.setItem(`espeezy_guide_${id}_dismissed`, 'true')
    }
  }, DISMISSED_PAGE_GUIDES)

  const closeProfile = page.getByRole('button', { name: /close profile setup/i })
  if (await closeProfile.isVisible().catch(() => false)) {
    await closeProfile.click({ force: true })
    await page.locator('.onboarding-overlay').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => null)
  }

  const gotIt = page.getByRole('button', { name: /^got it$/i })
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click({ force: true })
    await page.locator('.social-guide-root').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => null)
  }

  const enterWorkspace = page.getByRole('button', { name: /^enter workspace$/i })
  if (await enterWorkspace.isVisible().catch(() => false)) {
    await enterWorkspace.click()
    return
  }

  const closeGuide = page.getByRole('button', { name: /close guide/i })
  if (await closeGuide.isVisible().catch(() => false)) {
    await closeGuide.click({ force: true })
    await page.locator('.social-guide-root').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => null)
    return
  }

  if (await page.locator('.onboarding-overlay').isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await page.locator('.onboarding-overlay').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => null)
  }
}

/** Wait until the main kanban surface is visible (post onboarding). */
export async function waitForKanbanBoard(page: Page): Promise<void> {
  const board = page
    .getByRole('region', { name: /kanban board/i })
    .or(page.getByTestId('kanban-board'))
  await board.first().waitFor({ state: 'visible', timeout: 60_000 })
}

/** Create a team from WelcomeOnboarding when needed, then wait for the board. */
export async function completeWelcomeOnboardingTeam(
  page: Page,
  teamName: string,
): Promise<boolean> {
  const welcome = page.getByText(/welcome to the hub/i)
  const board = page.getByTestId('kanban-board').or(page.getByRole('region', { name: /kanban board/i }))

  await welcome.or(board).first().waitFor({ state: 'visible', timeout: 45_000 }).catch(() => null)

  if (await welcome.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /create new team/i }).click()
    await page.getByPlaceholder(/capstone alpha/i).fill(teamName)
    await page.getByPlaceholder(/what is this team building/i).fill('E2E automated team')
    await page.getByRole('button', { name: /start team/i }).click()
    await expect(welcome).not.toBeVisible({ timeout: 45_000 }).catch(() => null)
  }

  try {
    await waitForKanbanBoard(page)
    await dismissBlockingOverlays(page)
    return true
  } catch {
    return false
  }
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

/** Sign up (or sign in after admin confirm) until off /login. */
export async function signUpToDashboard(
  page: Page,
  admin: SupabaseAdminConfig | null,
  adminWorks: boolean,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login?signup=true', { waitUntil: 'domcontentloaded' })
  await waitForLoginGate(page)
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-password').fill(password)
  await page.getByRole('checkbox').check()
  await page.locator('form').getByRole('button', { name: /^create account$/i }).click()

  const leftLogin = await page
    .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    .then(() => true)
    .catch(() => false)

  if (!leftLogin && adminWorks && admin) {
    await confirmUserByEmail(admin, email)
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(password)
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
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
