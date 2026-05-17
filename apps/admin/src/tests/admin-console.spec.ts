import { test, expect } from '@playwright/test'

test.describe('Admin console', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Admin sign in')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder('pete')).toBeVisible()
  })

  test('staff login and navigate learn + files', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/login')
    await page.getByPlaceholder('pete').fill('pete')
    await page.getByLabel('Password').fill('EspeezyAdmin2026!')
    await page.getByRole('button', { name: /^Sign in$/i }).click()

    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 })
    const sidebar = page.getByRole('complementary', { name: 'Admin navigation' })
    await expect(sidebar).toBeVisible({ timeout: 30_000 })
    await sidebar.getByRole('link', { name: 'Dev learning' }).click()
    await expect(page.getByRole('heading', { name: /Dev learning/i })).toBeVisible()

    await sidebar.getByRole('link', { name: 'Files' }).click()
    await expect(page.getByRole('heading', { name: /^Files$/i })).toBeVisible()
    await expect(page.getByText(/Storage quota/i)).toBeVisible()
  })
})
