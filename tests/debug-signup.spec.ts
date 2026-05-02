/**
 * Diagnostic test — minimal signup flow to verify selectors
 */
import { test, expect } from '@playwright/test'

test('debug: signup only', async ({ page }) => {
  test.setTimeout(60_000)

  const RUN_ID = Date.now().toString().slice(-8)
  const EMAIL = `diag_${RUN_ID}@testrunner.dev`
  const PASSWORD = 'E2eTest@2026!'
  const SCHOOL_ID = `SCH-${RUN_ID}`

  console.log(`Navigating to /login`)
  await page.goto('/login')

  // Log the page title
  const title = await page.title()
  console.log(`Page title: "${title}"`)

  // Wait for auth check to complete (spinner goes away)
  await page.waitForTimeout(3000)

  // Take a snapshot of what's visible
  const pageContent = await page.content()
  const hasToggle = pageContent.includes("Don't have an account")
  console.log(`Has "Don't have an account" text: ${hasToggle}`)

  // Try to click the toggle
  console.log(`Clicking signup toggle...`)
  await page.click("text=/Don.*t have an account/i")
  console.log(`Clicked toggle`)

  await page.waitForTimeout(1000)
  
  // Check what buttons exist
  const buttons = await page.locator('button').allTextContents()
  console.log(`Buttons on page: ${JSON.stringify(buttons)}`)

  // Fill signup form
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.check('input[id="legal"]')
  console.log(`Form filled`)

  // Check buttons again
  const btnsAfterFill = await page.locator('button').allTextContents()
  console.log(`Buttons after form fill: ${JSON.stringify(btnsAfterFill)}`)

  // Check if "Create account" button exists
  const createAccountBtn = page.locator('button:has-text("Create account")')
  const createAccountCount = await createAccountBtn.count()
  console.log(`"Create account" button count: ${createAccountCount}`)
  
  // Check if button is disabled
  if (createAccountCount > 0) {
    const isDisabled = await createAccountBtn.first().isDisabled()
    console.log(`"Create account" button disabled: ${isDisabled}`)
  }

  // Submit
  console.log(`Clicking "Create account"...`)
  await createAccountBtn.first().click({ timeout: 10_000 })
  console.log(`Clicked - waiting for redirect`)

  // Wait for redirect
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  console.log(`✓ Redirected to dashboard!`)
})
