import { test, expect } from '@playwright/test'
import * as path from 'path'
import {
  confirmUserByEmail,
  deleteUserByEmail,
  generateRecoveryLink,
  getSupabaseAdminConfig,
  uniqueTestEmail,
  waitForLoginGate,
} from './helpers/auth-e2e'

const admin = getSupabaseAdminConfig(path.join(process.cwd()))
const INITIAL_PASSWORD = 'E2eTest@2026!'
const RESET_PASSWORD = 'E2eReset@2026!'
const BASE = 'http://localhost:3001'

test.describe.configure({ mode: 'serial' })
test.use({ actionTimeout: 60_000, navigationTimeout: 90_000 })

test.describe('Kanban signup, login, and password reset', () => {
  test.skip(!admin, 'Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/kanban/.env.local')

  const email = uniqueTestEmail('kanban')

  test.afterAll(async () => {
    if (admin) await deleteUserByEmail(admin, email)
  })

  test('signup, login, reset password, login with new password', async ({ page }) => {
    test.setTimeout(120_000)

    await page.context().clearCookies()
    await page.goto('/login?signup=true', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /join espeezy/i })).toBeVisible({ timeout: 20_000 })
    await waitForLoginGate(page)

    await page.locator('#email').fill(email)
    await page.locator('#password').fill(INITIAL_PASSWORD)
    await page.locator('#legal').check()
    await page.getByRole('button', { name: /create scholar account/i }).click()

    await page.waitForTimeout(2500)
    if (page.url().includes('/login')) {
      await confirmUserByEmail(admin!, email)
      await page.goto('/login')
      await page.locator('#email').fill(email)
      await page.locator('#password').fill(INITIAL_PASSWORD)
      await page.getByRole('button', { name: /^sign in$/i }).click()
    }

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#email').fill(email)
    await page.getByRole('button', { name: /recovery link/i }).click()
    await expect(page.getByText(/recovery link sent/i)).toBeVisible({ timeout: 15_000 })

    const recoveryUrl = await generateRecoveryLink(
      admin!,
      email,
      `${BASE}/auth/callback?type=recovery`,
    )
    await page.goto(recoveryUrl)
    await expect(page.getByRole('heading', { name: /secure account recovery/i })).toBeVisible({
      timeout: 30_000,
    })

    await page.locator('input[type="password"]').first().fill(RESET_PASSWORD)
    await page.locator('input[type="password"]').nth(1).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: /update password/i }).click()
    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 20_000 })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(RESET_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')
  })
})
