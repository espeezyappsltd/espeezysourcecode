import { test, expect, type Page } from '@playwright/test'
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
const PASSWORD = 'E2eCrud@2026!'
let adminWorks = false

function tomorrowDateInput(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

async function dismissAccountTiersBanner(page: Page) {
  const dismiss = page.getByRole('button', { name: /dismiss account tiers/i })
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click()
  }
}

async function fillNewTaskModal(page: Page, title: string) {
  await page.getByRole('textbox', { name: /task name/i }).fill(title)
  await page.locator('.modal-content input[type="date"]').fill(tomorrowDateInput())
}

async function saveTaskAndWaitForBoard(page: Page, title: string) {
  const workflowResponse = page.waitForResponse(
    (res) => res.url().includes('/api/task/workflow') && res.request().method() === 'POST',
    { timeout: 60_000 },
  )
  await page.getByRole('button', { name: /^save task$/i }).click()
  await workflowResponse
  await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible({
    timeout: 30_000,
  })
}

async function ensureBoardReady(page: Page) {
  const email = uniqueTestEmail('kanban_crud')
  await signUpToDashboard(page, admin, adminWorks, email, PASSWORD)

  const teamReady = await completeWelcomeOnboardingTeam(
    page,
    `CRUD Team ${Date.now().toString().slice(-4)}`,
  )
  if (!teamReady) {
    throw new Error('Could not create a team and reach the kanban board')
  }

  await waitForKanbanBoard(page)
  await dismissBlockingOverlays(page)
  await expect(page.getByRole('button', { name: /create a new task/i })).toBeVisible({ timeout: 30_000 })
}

test.describe('KanbanBoard CRUD & Drag', () => {
  test.skip(!admin, 'Requires Supabase admin config in apps/kanban/.env.local')

  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    if (admin) adminWorks = await isAdminApiAvailable(admin)
  })

  test('Create and edit a task', async ({ page }) => {
    test.setTimeout(180_000)
    await ensureBoardReady(page)
    await dismissBlockingOverlays(page)
    await dismissAccountTiersBanner(page)

    await page.getByRole('button', { name: /create a new task/i }).click({ force: true })
    await fillNewTaskModal(page, 'E2E Test Task')
    await saveTaskAndWaitForBoard(page, 'E2E Test Task')

    await page.getByRole('heading', { name: 'E2E Test Task', exact: true }).first().click()
    await page.getByRole('textbox', { name: /task name/i }).fill('E2E Test Task Updated')
    await saveTaskAndWaitForBoard(page, 'E2E Test Task Updated')
  })

  test('Delete a task', async ({ page }) => {
    test.skip(true, 'Delete flow varies by board permissions; covered in onboarding E2E')
  })

  test('Drag and drop task to another column', async ({ page }) => {
    test.skip(true, 'Drag/drop requires stable Liveblocks session; covered manually')
  })
})
