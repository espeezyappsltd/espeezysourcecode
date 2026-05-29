import { test, expect } from '@playwright/test'
import * as path from 'path'
import {
  confirmUserByEmail,
  deleteUserByEmail,
  generateRecoveryLink,
  getSupabaseAdminConfig,
  isAdminApiAvailable,
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
  let adminWorks = false

  test.beforeAll(async () => {
    if (admin) adminWorks = await isAdminApiAvailable(admin)
  })

  test.afterAll(async () => {
    if (admin && adminWorks) await deleteUserByEmail(admin, email)
  })

  test('signup and login', async ({ page }) => {
    test.setTimeout(120_000)

    await page.context().clearCookies()
    await page.goto('/login?signup=true', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Espeezy Games/i })).toBeVisible({ timeout: 20_000 })
    await waitForLoginGate(page)

    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(INITIAL_PASSWORD)
    await page.getByRole('checkbox').check()
    await page.locator('form').getByRole('button', { name: /^create account$/i }).click()

    const leftLogin = await page
      .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
      .then(() => true)
      .catch(() => false)

    if (!leftLogin) {
      const alert = page.getByRole('alert')
      if (await alert.isVisible()) {
        const message = (await alert.textContent())?.trim()
        if (message) throw new Error(`Signup failed: ${message}`)
      }
      if (!adminWorks) {
        throw new Error('Signup did not leave /login and admin API is unavailable to confirm the user.')
      }
      await confirmUserByEmail(admin!, email)
      await page.goto('/login', { waitUntil: 'domcontentloaded' })
      await waitForLoginGate(page)
      await page.locator('#auth-email').fill(email)
      await page.locator('#auth-password').fill(INITIAL_PASSWORD)
      await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    }

    expect(page.url()).not.toContain('/login')

    await page.context().clearCookies()
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(INITIAL_PASSWORD)
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')
  })

  test('password reset', async ({ page }) => {
    test.skip(!adminWorks, 'Requires a valid SUPABASE_SERVICE_ROLE_KEY for recovery links')
    test.setTimeout(120_000)

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#auth-email').fill(email)
    await page.getByRole('button', { name: /forgot password/i }).click()

    const recoveryUrl = await generateRecoveryLink(
      admin!,
      email,
      `${BASE}/auth/callback?type=recovery`,
    )
    await page.goto(recoveryUrl, { waitUntil: 'domcontentloaded' })
    if (!page.url().includes('reset-password')) {
      await page.goto('/reset-password', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    }

    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible({
      timeout: 30_000,
    })

    const newPasswordInput = page.getByPlaceholder(/new password/i)
    const sessionReady = await newPasswordInput
      .isEnabled({ timeout: 45_000 })
      .catch(() => false)
    if (!sessionReady) {
      await expect(page.getByText(/recovery session/i)).toBeVisible({ timeout: 10_000 })
      return
    }

    await newPasswordInput.fill(RESET_PASSWORD)
    await page.getByPlaceholder(/confirm password/i).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: /update password/i }).click()
    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 20_000 })

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await waitForLoginGate(page)
    await page.locator('#auth-email').fill(email)
    await page.locator('#auth-password').fill(RESET_PASSWORD)
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
    expect(page.url()).not.toContain('/login')
  })
})
