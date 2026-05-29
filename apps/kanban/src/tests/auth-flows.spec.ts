import { test, expect } from '@playwright/test'

/**
 * Auth flow smoke tests: login gate, open-redirect guards, callback routes.
 */
test.describe('Auth flows', () => {
  test('login page shows form after session check', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /espeezy kanban/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('login rejects open redirect in next param', async ({ page }) => {
    await page.goto('/login?next=https://evil.example')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(new URL(page.url()).pathname).toBe('/login')
  })

  test('auth callback rejects external next redirect', async ({ page }) => {
    const res = await page.goto('/auth/callback?next=//evil.example')
    expect(res?.url()).toMatch(/\/login(\?|$)/)
    expect(res?.url()).not.toContain('evil.example')
  })

  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })
})
