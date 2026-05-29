import { test, expect } from '@playwright/test'

/**
 * Prereg auth smoke tests: login gate, callback hardening, recovery route.
 */
test.describe('Prereg auth flows', () => {
  test('login page shows form after session check', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /create espeezy account|sign in to espeezy/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByPlaceholder(/you@university\.edu/i)).toBeVisible()
  })

  test('login rejects open redirect in next param', async ({ page }) => {
    await page.goto('/login?next=https://evil.example')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(new URL(page.url()).pathname).toBe('/login')
  })

  test('auth callback rejects external next redirect', async ({ page }) => {
    const res = await page.goto('/auth/callback?next=//evil.example')
    expect(res?.url()).toMatch(/\/(\?|$)/)
    expect(res?.url()).not.toContain('evil.example')
  })

  test('auth callback recovery type routes to reset password', async ({ page }) => {
    const res = await page.goto('/auth/callback?type=recovery')
    expect(res?.url()).toContain('/reset-password')
  })
})
