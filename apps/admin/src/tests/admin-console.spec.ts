import { test, expect, type Page } from '@playwright/test'

async function primeCookieConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('gf_cookie_consent', 'all')
  })
}

async function dismissCookieBannerIfVisible(page: Page) {
  const accept = page.getByRole('button', { name: /yes, accept all/i })
  if (await accept.isVisible().catch(() => false)) {
    await accept.click()
  }
}

test.describe('Admin console', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Espeezy Panel')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder('pete')).toBeVisible()
  })

  test('staff login and navigate learn + files', async ({ page }) => {
    test.setTimeout(120_000)
    await primeCookieConsent(page)
    await page.goto('/login')
    await page.getByPlaceholder('pete').fill('pete')
    await page.getByRole('button', { name: /^Continue$/i }).click()
    await page.getByPlaceholder('000000').fill('000000')
    await dismissCookieBannerIfVisible(page)
    await page.getByRole('button', { name: /^Sign in$/i }).click()

    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 })
    const sidebar = page.getByRole('complementary', { name: 'Admin navigation' })
    await expect(sidebar).toBeVisible({ timeout: 30_000 })
    await page.goto('/admin/learn')
    await expect(page.getByRole('heading', { name: /Dev learning/i })).toBeVisible()

    await page.goto('/admin/files')
    await expect(page.getByRole('heading', { name: /^Files$/i })).toBeVisible()
    await expect(page.getByText(/Private vault \(5GB\)|upload/i)).toBeVisible()
  })
})
