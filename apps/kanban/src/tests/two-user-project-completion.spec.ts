import { test, expect, type Page, type Download } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { hasLiveSupabaseConfig, loadTestEnv, resolveSupabaseUrlFromEnv } from './lib/load-test-env'
import {
  confirmUserByEmail,
  getSupabaseAdminConfig,
  isAdminApiAvailable,
  waitForLoginGate,
} from './helpers/auth-e2e'
import { adminRest, findUserIdByEmail } from './helpers/onboarding-e2e'

const ENV = loadTestEnv()
const SUPABASE_URL = resolveSupabaseUrlFromEnv(ENV)
const hasLiveSupabase = hasLiveSupabaseConfig(ENV)
const admin = getSupabaseAdminConfig(path.join(process.cwd()))

/**
 * Two scholars complete a shared project and verify analytics + ALL DONE celebration.
 * Requires: dev server on :3001, Supabase with email auto-confirm (or admin confirm fallback).
 */
test.describe('Two-user project completion and analytics accuracy', () => {
  test.skip(
    !hasLiveSupabase,
    `Supabase not configured (resolved URL: ${SUPABASE_URL || 'none'}). Set NEXT_PUBLIC_SUPABASE_PROJECT_URL or NEXT_PUBLIC_SUPABASE_URL in .env.local.`,
  )
  test.setTimeout(300000)

  test('Owner + member: tasks to Done, KPIs and CSV report match', async ({ browser }) => {
    const suffix = Date.now().toString().slice(-6)
    const teamName = `E2E Team ${suffix}`
    const taskA = `Deliverable A ${suffix}`
    const taskB = `Deliverable B ${suffix}`

    const owner = { email: `owner_${suffix}@e2e.espeezy.test`, password: 'TestPassword123!', name: 'Owner Scholar' }
    const member = { email: `member_${suffix}@e2e.espeezy.test`, password: 'TestPassword123!', name: 'Member Scholar' }

    const ctxOwner = await browser.newContext()
    const ctxMember = await browser.newContext()
    await ctxOwner.clearCookies()
    await ctxMember.clearCookies()
    const pageOwner = await ctxOwner.newPage()
    const pageMember = await ctxMember.newPage()

    let adminWorks = false
    if (admin) adminWorks = await isAdminApiAvailable(admin)

    const authFlow = async (page: Page, user: typeof owner) => {
      await page.goto('/login?signup=true', { waitUntil: 'domcontentloaded', timeout: 90000 })

      if (await page.getByText(/welcome to the hub/i).isVisible().catch(() => false)) return

      await waitForLoginGate(page)
      await page.locator('#auth-email').fill(user.email)
      await page.locator('#auth-password').fill(user.password)
      await page.getByRole('checkbox').check()
      await page.locator('form').getByRole('button', { name: /^create account$/i }).click()

      const leftLogin = await page
        .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45000 })
        .then(() => true)
        .catch(() => false)

      if (!leftLogin && adminWorks && admin) {
        await confirmUserByEmail(admin, user.email)
        await page.goto('/login', { waitUntil: 'domcontentloaded' })
        await waitForLoginGate(page)
        await page.locator('#auth-email').fill(user.email)
        await page.locator('#auth-password').fill(user.password)
        await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45000 })
      }
    }

    const completeProfileOnboarding = async (page: Page, fullName: string) => {
      const dialog = page.getByRole('dialog', { name: /welcome to espeezy/i })
      if (!(await dialog.isVisible().catch(() => false))) return

      await page.getByRole('textbox', { name: /full name/i }).fill(fullName)
      await page.getByRole('button', { name: /^continue$/i }).click()

      await page.getByRole('radio').first().click()
      await page.getByRole('button', { name: /finish setup/i }).click()

      await page.getByRole('button', { name: /go to dashboard/i }).click({ timeout: 15000 }).catch(() => undefined)
      await expect(dialog).toBeHidden({ timeout: 20000 }).catch(() => undefined)
    }

    const createTeam = async (page: Page, name: string) => {
      await expect(page.getByText(/welcome to the hub/i)).toBeVisible({ timeout: 30000 })
      await page.getByRole('button', { name: /create new team/i }).click()
      const teamNameInput = page.getByPlaceholder('e.g. Capstone Alpha')
      await expect(teamNameInput).toBeVisible({ timeout: 60000 })
      await teamNameInput.fill(name)
      await page.getByPlaceholder('What is this team building?').fill('E2E analytics verification project')
      await page.getByRole('button', { name: /^start team$/i }).click()
      await expect(page.getByText(/TEAM:/i)).toBeVisible({ timeout: 30000 })
    }

    const createTask = async (page: Page, title: string, status: 'To Do' | 'Done' = 'To Do') => {
      await page.getByRole('button', { name: /new task/i }).click()
      await page.locator('#task-title').fill(title)
      await page.locator('#task-desc').fill(`E2E task ${title}`)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.locator('#task-date').fill(tomorrow.toISOString().split('T')[0])
      if (status !== 'To Do') {
        await page.locator('#task-status').selectOption(status)
      }
      await page.getByRole('button', { name: /save task/i }).click()
      await expect(page.getByTestId('kanban-board').getByRole('button', { name: new RegExp(title, 'i') })).toBeVisible({
        timeout: 30000,
      })
    }

    const fetchGroupIdForUser = async (email: string): Promise<string> => {
      expect(admin).toBeTruthy()
      const userId = await findUserIdByEmail(admin!, email)
      expect(userId).toBeTruthy()
      const profiles = await adminRest<{ group_id: string | null }[]>(admin!, 'profiles', {
        query: { select: 'group_id', id: `eq.${userId}` },
      })
      const gid = profiles[0]?.group_id
      expect(gid).toBeTruthy()
      return gid!
    }

    // ── Owner: signup, team, first task ─────────────────────────────
    await authFlow(pageOwner, owner)
    await completeProfileOnboarding(pageOwner, owner.name)
    await createTeam(pageOwner, teamName)
    const teamId = await fetchGroupIdForUser(owner.email)

    await createTask(pageOwner, taskA, 'Done')

    // ── Member: join team ───────────────────────────────────────────
    await authFlow(pageMember, member)
    await completeProfileOnboarding(pageMember, member.name)
    await expect(pageMember.getByText(/welcome to the hub/i)).toBeVisible({ timeout: 30000 })
    await pageMember.getByRole('button', { name: /join existing team/i }).click()
    await pageMember.getByPlaceholder('Paste UUID here...').fill(teamId)
    await pageMember.getByRole('button', { name: /^join project$/i }).click()
    await expect(pageMember.getByText(/TEAM:/i)).toBeVisible({ timeout: 30000 })

    await expect(pageMember.getByTestId('kanban-board').getByRole('button', { name: new RegExp(taskA, 'i') })).toBeVisible({
      timeout: 30000,
    })

    await createTask(pageMember, taskB, 'Done')

    // ── Dashboard: 100% completion → ALL DONE banner (new architecture) ─
    await pageOwner.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(pageOwner.getByTestId('kanban-board')).toBeVisible({ timeout: 60000 })
    await pageOwner.getByRole('button', { name: /refresh board data/i }).click()
    await expect(pageOwner.getByTestId('kanban-all-done-banner')).toBeVisible({ timeout: 60000 })
    await expect(pageOwner.getByTestId('kanban-all-done-banner')).toContainText('ALL DONE')
    await expect(pageOwner.getByTestId('kanban-overall-completion')).toContainText('ALL DONE', { timeout: 15000 })

    const celebratedTaskCount = await pageOwner.evaluate((gid) => {
      return localStorage.getItem(`gf_completion_celebrated_${gid}`)
    }, teamId)
    expect(celebratedTaskCount).toBe('2')

    await pageMember.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(pageMember.getByTestId('kanban-board')).toBeVisible({ timeout: 60000 })
    await pageMember.getByRole('button', { name: /refresh board data/i }).click()
    await expect(pageMember.getByTestId('kanban-overall-completion')).toContainText('ALL DONE', { timeout: 60000 })

    // ── Analytics: owner verifies KPIs (2 tasks, 2 done = 100%) ─────
    await pageOwner.getByRole('button', { name: /group updates/i }).click()
    await expect(pageOwner).toHaveURL(/\/analytics\/.+/, { timeout: 15000 })

    await expect(pageOwner.getByTestId('analytics-kpi-progress')).toContainText('100%', { timeout: 20000 })
    await expect(pageOwner.getByTestId('analytics-kpi-completed')).toContainText('2/2', { timeout: 10000 })
    await expect(pageOwner.getByTestId('analytics-kpi-overdue')).toContainText('0', { timeout: 10000 })
    await expect(pageOwner.getByTestId('analytics-executive-report')).toBeAttached()

    // ── CSV export: member summary matches task actions ─────────────
    const downloadPromise = pageOwner.waitForEvent('download', { timeout: 30000 })
    await pageOwner.getByRole('button', { name: /csv/i }).click()
    const download: Download = await downloadPromise
    const csvPath = path.join(os.tmpdir(), `e2e-analytics-${suffix}.csv`)
    await download.saveAs(csvPath)
    const csv = fs.readFileSync(csvPath, 'utf-8')
    expect(csv).toContain('MEMBER SUMMARY')
    expect(csv).toMatch(/Owner Scholar|owner/i)
    expect(csv).toMatch(/Member Scholar|member/i)

    await expect(pageOwner.getByText(taskA)).toBeVisible()
    await expect(pageOwner.getByText(taskB)).toBeVisible()

    await ctxOwner.close()
    await ctxMember.close()
  })
})
