import { test, expect } from '@playwright/test'
import * as path from 'path'
import {
  getSupabaseAdminConfig,
  isAdminApiAvailable,
  completeWelcomeOnboardingTeam,
  dismissBlockingOverlays,
  signUpToDashboard,
  uniqueTestEmail,
  waitForKanbanBoard,
} from './helpers/auth-e2e'

const admin = getSupabaseAdminConfig(path.join(process.cwd()))
const PASSWORD = 'E2eA11y@2026!'

test.describe('KanbanBoard Accessibility', () => {
  test.skip(!admin, 'Requires Supabase admin config in apps/kanban/.env.local')

  let adminWorks = false

  test.beforeAll(async () => {
    if (admin) adminWorks = await isAdminApiAvailable(admin)
  })

  test.beforeEach(async ({ page }, testInfo) => {
    const email = uniqueTestEmail('kanban_a11y')
    await signUpToDashboard(page, admin, adminWorks, email, PASSWORD)

    const teamReady = await completeWelcomeOnboardingTeam(
      page,
      `A11y Team ${Date.now().toString().slice(-4)}`,
    )
    if (!teamReady) {
      testInfo.skip(true, 'Could not create a team and reach the kanban board')
      return
    }

    await waitForKanbanBoard(page)
    await dismissBlockingOverlays(page)
  })

  test('Kanban board has region and columns with ARIA', async ({ page }) => {
    await expect(page.getByRole('region', { name: /kanban board/i })).toBeVisible()
    for (const col of ['To Do', 'In Progress', 'In Review', 'Done']) {
      await expect(page.getByRole('heading', { name: col, exact: true })).toBeVisible()
      await expect(page.locator(`section[aria-label*="${col} column"]`)).toBeVisible()
    }
  })

  test('Create task control is keyboard reachable', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create a new task/i })
    await createBtn.focus()
    await expect(createBtn).toBeFocused()
  })

  test('New task modal exposes dialog semantics', async ({ page }) => {
    await page.getByRole('button', { name: /create a new task/i }).click()
    const modal = page.locator('.modal-content')
    await expect(modal).toBeVisible({ timeout: 10_000 })
    await expect(modal.locator('input[placeholder*="needs to be done" i]')).toBeVisible()
  })
})
