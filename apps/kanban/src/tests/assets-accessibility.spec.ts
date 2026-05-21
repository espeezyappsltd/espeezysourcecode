import { test, expect } from '@playwright/test'

/**
 * Personal Arsenal WCAG-oriented smoke tests (structure, keyboard, responsive).
 * Authenticated vault UI requires a logged-in session; these validate public gates + login a11y.
 */
test.describe('Personal Arsenal accessibility & device compatibility', () => {
  test('unauthenticated assets redirects to login', async ({ page }) => {
    await page.goto('/assets')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('assets section routes redirect to login with accessible form', async ({ page }) => {
    for (const path of ['/assets/storage', '/assets/credits', '/assets/marketplace']) {
      await page.goto(path)
      await page.waitForURL(/\/login/, { timeout: 15_000 })
    }
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in|continue/i })).toBeVisible()
  })

  test('login page is keyboard reachable', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('assets login gate fits narrow viewport without horizontal scroll', async ({ page }) => {
      await page.goto('/assets')
      await page.waitForURL(/\/login/, { timeout: 15_000 })
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    })
  })

  test.describe('tablet viewport', () => {
    test.use({ viewport: { width: 834, height: 1194 } })

    test('login page remains usable on tablet', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })
  })
})
