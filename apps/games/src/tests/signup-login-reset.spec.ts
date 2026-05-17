import { test, expect } from '@playwright/test'
import * as path from 'path'
import {
  confirmUserByEmail,
  deleteUserByEmail,
  generateRecoveryLink,
  getSupabaseAdminConfig,
  grantGamesProAccess,
  uniqueTestEmail,
  waitForLoginGate,
} from './helpers/auth-e2e'

const admin = getSupabaseAdminConfig(path.join(process.cwd()))
const INITIAL_PASSWORD = 'E2eTest@2026!'
const RESET_PASSWORD = 'E2eReset@2026!'
const BASE = 'http://localhost:3002'

test.describe.configure({ mode: 'serial' })
test.use({ actionTimeout: 60_000, navigationTimeout: 90_000 })

test.describe('Games signup, login, and password reset', () => {
  test.skip(!admin, 'Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/games/.env.local')

  const email = uniqueTestEmail('games')

  test.afterAll(async () => {
    if (admin) await deleteUserByEmail(admin, email)
  })

  test('signup, login, reset password, login with new password', async ({ page }) => {
    test.setTimeout(120_000)

    await page.context().clearCookies()
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /sign in to play/i })).toBeVisible({ timeout: 20_000 })
    await waitForLoginGate(page)

    await page.getByRole('button', { name: /create one now/i }).click()
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

    await page.getByLabel(/^email$/i).fill(email)
    await page.getByLabel(/^password$/i).fill(INITIAL_PASSWORD)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /create account/i }).click()

    await page.waitForTimeout(2500)
    if (page.url().includes('/login')) {
      await confirmUserByEmail(admin!, email)
      await grantGamesProAccess(admin!, email)
      await page.goto('/login', { waitUntil: 'domcontentloaded' })
      await waitForLoginGate(page)
      await page.getByLabel(/^email$/i).fill(email)
      await page.getByLabel(/^password$/i).fill(INITIAL_PASSWORD)
      await page.getByRole('button', { name: /sign in & play/i }).click()
    }

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')
    expect(page.url()).not.toContain('upgrade=1')

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.getByLabel(/^email$/i).fill(email)
    await page.getByRole('button', { name: /forgot password/i }).click()
    await expect(page.getByText(/recovery link sent/i)).toBeVisible({ timeout: 15_000 })

    const recoveryUrl = await generateRecoveryLink(
      admin!,
      email,
      `${BASE}/auth/callback?type=recovery`,
    )
    await page.goto(recoveryUrl)
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible({
      timeout: 30_000,
    })

    await page.getByPlaceholder(/new password/i).fill(RESET_PASSWORD)
    await page.getByPlaceholder(/confirm password/i).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: /update password/i }).click()
    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 20_000 })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.getByLabel(/^email$/i).fill(email)
    await page.getByLabel(/^password$/i).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: /sign in & play/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')
    expect(page.url()).not.toContain('upgrade=1')
  })
})
