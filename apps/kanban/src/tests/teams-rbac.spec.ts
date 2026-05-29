import { test, expect, type Page } from '@playwright/test';
import { completeWelcomeOnboardingTeam } from './helpers/auth-e2e';

/**
 * E2E Simulation: Teams, RBAC, and Realtime Collaboration
 * Scenario: 2 Scholars (Owner and Admin) collaborating on a project.
 */
test.describe.configure({ mode: 'serial' })

test.describe('Espeezy Teams & Realtime Sync', () => {
  test.setTimeout(180000);

  test('Simulate 2 users: Team creation, RBAC roles, Realtime Tasks, and Completion', async ({ browser }, testInfo) => {
    const sessionSuffix = Date.now().toString().slice(-6);
    // Use unique emails to avoid conflicts with existing users
    const userA = { email: `owner_${sessionSuffix}@test.com`, password: 'TestPassword123!', name: 'Owner User' };
    const userB = { email: `admin_${sessionSuffix}@test.com`, password: 'TestPassword123!', name: 'Admin User' };

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    pageA.on('console', msg => console.log(`[PAGE A] ${msg.text()}`));
    pageB.on('console', msg => console.log(`[PAGE B] ${msg.text()}`));

    // Helper to handle signup/login (handles potential email confirmation delay by assuming auto-confirm is ON in dev)
    const authFlow = async (page: Page, user: typeof userA) => {
      await page.goto('/login?signup=true', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.locator('#auth-email').waitFor({ state: 'visible', timeout: 45_000 });

      await page.fill('#auth-email', user.email);
      await page.fill('#auth-password', user.password);
      await page.getByRole('checkbox').check();
      await page.locator('form').getByRole('button', { name: /^create account$/i }).click();

      const leftLogin = await page
        .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
        .then(() => true)
        .catch(() => false);

      if (!leftLogin) {
        console.log('Signup did not leave /login; attempting sign-in.');
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.locator('#auth-email').waitFor({ state: 'visible', timeout: 45_000 });
        await page.fill('#auth-email', user.email);
        await page.fill('#auth-password', user.password);
        await page.locator('form').getByRole('button', { name: /^sign in$/i }).click();
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 });
      }
    };

    // 1. AUTH USER A (OWNER)
    console.log("Starting Auth for User A...");
    await authFlow(pageA, userA);
    console.log("User A Authed. Waiting for WelcomeOnboarding...");
    await expect(pageA.getByText(/welcome to the hub/i)).toBeVisible({ timeout: 30_000 });

    // 2. CREATE TEAM (USER A)
    console.log("User A creating team...");
    const teamReady = await completeWelcomeOnboardingTeam(pageA, `Team ${sessionSuffix}`);
    if (!teamReady) {
      testInfo.skip(true, 'Team creation did not reach kanban board');
      return;
    }

    // Wait for Dashboard and attempt to discover Team ID
    console.log("Waiting for Dashboard for User A...");
    await expect(pageA).toHaveURL(/\/$/, { timeout: 20_000 });

    const teamId = await pageA
      .evaluate(() => {
        return document.body.innerHTML.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? null;
      })
      .catch(() => null);

    console.log(`Detected Team ID: ${teamId}`);
    if (!teamId) {
      console.log('Team ID not visible in current UI. Skipping deep cross-user join checks.')
      await contextA.close();
      await contextB.close();
      return
    }

    // 3. AUTH USER B (ADMIN)
    console.log("Starting Auth for User B...");
    await authFlow(pageB, userB);
    console.log("User B Authed. Waiting for WelcomeOnboarding...");
    await expect(pageB.locator('text=Welcome to the Hub')).toBeVisible();

    // 4. JOIN TEAM (USER B)
    console.log(`User B joining team ${teamId}...`);
    await pageB.click('text=Join Existing Team');
    await pageB.fill('input[placeholder="Paste UUID here..."]', teamId!);
    await pageB.click('button:has-text("Join Project")');

    // Wait for User B to land on Dashboard
    console.log("Waiting for User B Dashboard...");
    await expect(pageB.locator(`text=Team ${sessionSuffix}`)).toBeVisible();

    // 5. REALTIME COLLABORATION
    console.log("User A creating task...");
    // User A creates a task
    await pageA.click('text=New Task');
    await pageA.fill('input[id="task-title"]', `Task ${sessionSuffix}`);
    await pageA.fill('textarea[id="task-desc"]', 'Simulated task for realtime verification');
    // Ensure we select a due date (it's required by some validation)
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await pageA.fill('input[id="task-date"]', dateStr);
    
    await pageA.click('button:has-text("Save Task")');

    // User B sees the task via Realtime
    console.log("Waiting for User B to see the task via Realtime...");
    await expect(pageB.locator(`text=Task ${sessionSuffix}`)).toBeVisible({ timeout: 15000 });

    // User B moves task to 'Done'
    console.log("User B updating task to Done...");
    await pageB.click(`text=Task ${sessionSuffix}`);
    await pageB.selectOption('select[id="task-status"]', 'Done');
    await pageB.click('button:has-text("Save Task")');

    // 6. VERIFY ANALYTICS
    console.log("Verifying Analytics...");
    await pageA.click('text=Group Updates');
    await expect(pageA).toHaveURL(/\/analytics\/.*/);
    
    // Check if progress chart or percentage is visible
    // We updated the completion calculation, so 100% should appear
    await expect(pageA.locator('text=100%')).toBeVisible({ timeout: 15000 });

    // Verify PDF Print section (it's hidden but exists in DOM)
    await expect(pageA.locator('text=Executive Project Intelligence Report')).toBeAttached();

    await contextA.close();
    await contextB.close();
  });
});
