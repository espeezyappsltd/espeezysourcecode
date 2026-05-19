import { test, expect } from '@playwright/test'

/**
 * Games auth smoke tests: login gate, tier proxy redirects, callback hardening.
 */
test.describe('Games auth flows', () => {
  test('login page shows form after session check', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to play/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('login rejects open redirect in next param', async ({ page }) => {
    await page.goto('/login?next=https://evil.example')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).not.toContain('evil.example')
  })

  test('auth callback rejects external next redirect', async ({ page }) => {
    const res = await page.goto('/auth/callback?next=//evil.example')
    expect(res?.url()).toMatch(/\/(\?|$)/)
    expect(res?.url()).not.toContain('evil.example')
  })

  test('unauthenticated categories route redirects to login', async ({ page }) => {
    await page.goto('/categories')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('upgrade gate does not redirect-loop on login', async ({ page }) => {
    await page.goto('/login?upgrade=1')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toMatch(/\/login\?.*upgrade=1/)
    await expect(page.getByText(/pro account required/i)).toBeVisible({ timeout: 10_000 })
  })
})
