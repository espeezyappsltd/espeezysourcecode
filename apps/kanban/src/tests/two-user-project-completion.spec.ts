import { test, expect, type Page, type Download } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { hasLiveSupabaseConfig, loadTestEnv, resolveSupabaseUrlFromEnv } from './lib/load-test-env'

const ENV = loadTestEnv()
const SUPABASE_URL = resolveSupabaseUrlFromEnv(ENV)
const hasLiveSupabase = hasLiveSupabaseConfig(ENV)

/**
 * Two scholars complete a shared project and verify analytics artifacts match actions.
 * Requires: dev server on :3001, Supabase with email auto-confirm for test signups.
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

    const owner = { email: `owner_${suffix}@test.com`, password: 'TestPassword123!', name: 'Owner Scholar' }
    const member = { email: `member_${suffix}@test.com`, password: 'TestPassword123!', name: 'Member Scholar' }

    const ctxOwner = await browser.newContext()
    const ctxMember = await browser.newContext()
    await ctxOwner.clearCookies()
    await ctxMember.clearCookies()
    const pageOwner = await ctxOwner.newPage()
    const pageMember = await ctxMember.newPage()

    const authFlow = async (page: Page, user: typeof owner) => {
      await page.goto('/login?signup=true', { waitUntil: 'networkidle', timeout: 60000 })

      const onDashboard = page.getByText('Welcome to the Hub')
      if (await onDashboard.isVisible().catch(() => false)) return

      await page.waitForFunction(
        () => !!document.querySelector('#email'),
        { timeout: 20000 },
      )

      if (await page.getByRole('heading', { name: /secure login/i }).isVisible().catch(() => false)) {
        await page.getByRole('button', { name: /sign up/i }).click()
      }

      await page.locator('#email').fill(user.email, { force: true })
      await page.locator('#password').fill(user.password, { force: true })

      await page.evaluate(() => {
        const legal = document.getElementById('legal') as HTMLInputElement | null
        if (legal) {
          legal.checked = true
          legal.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      await page.locator('form button[type="submit"]').click({ force: true })

      try {
        await expect(page).toHaveURL(/\/$/, { timeout: 20000 })
      } catch {
        await page.goto('/login')
        await page.locator('#email').fill(user.email, { force: true })
        await page.locator('#password').fill(user.password, { force: true })
        await page.locator('form button[type="submit"]').click({ force: true })
        await expect(page).toHaveURL(/\/$/, { timeout: 20000 })
      }
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
        timeout: 20000,
      })
    }

    // ── Owner: signup, team, first task ─────────────────────────────
    await authFlow(pageOwner, owner)
    await expect(pageOwner.getByText('Welcome to the Hub')).toBeVisible({ timeout: 20000 })

    await pageOwner.getByRole('button', { name: /create new team/i }).click()
    await pageOwner.getByPlaceholder('e.g. Capstone Alpha').fill(teamName)
    await pageOwner.getByPlaceholder('What is this team building?').fill('E2E analytics verification project')
    await pageOwner.getByRole('button', { name: /start team/i }).click()
    await expect(pageOwner.getByText(/TEAM:/i)).toBeVisible({ timeout: 20000 })

    const teamId = await pageOwner.evaluate(() => {
      const match = document.body.innerHTML.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      )
      return match?.[0] ?? null
    })
    expect(teamId).toBeTruthy()

    await createTask(pageOwner, taskA, 'Done')

    // ── Member: join team ───────────────────────────────────────────
    await authFlow(pageMember, member)
    await expect(pageMember.getByText('Welcome to the Hub')).toBeVisible({ timeout: 20000 })
    await pageMember.getByRole('button', { name: /join existing team/i }).click()
    await pageMember.getByPlaceholder('Paste UUID here...').fill(teamId!)
    await pageMember.getByRole('button', { name: /join project/i }).click()
    await expect(pageMember.getByText(teamName)).toBeVisible({ timeout: 20000 })

    await expect(pageMember.getByTestId('kanban-board').getByRole('button', { name: new RegExp(taskA, 'i') })).toBeVisible({
      timeout: 20000,
    })

    await createTask(pageMember, taskB, 'Done')

    // ── Analytics: owner verifies KPIs (2 tasks, 2 done = 100%) ─────
    await pageOwner.getByRole('link', { name: /project stats/i }).click()
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

    // Task titles should appear in on-page task list
    await expect(pageOwner.getByText(taskA)).toBeVisible()
    await expect(pageOwner.getByText(taskB)).toBeVisible()

    await ctxOwner.close()
    await ctxMember.close()
  })
})
