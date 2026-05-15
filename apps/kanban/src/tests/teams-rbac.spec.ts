import { test, expect } from '@playwright/test';

/**
 * E2E Simulation: Teams, RBAC, and Realtime Collaboration
 * Scenario: 2 Scholars (Owner and Admin) collaborating on a project.
 */
test.describe('Espeezy Teams & Realtime Sync', () => {
  test.setTimeout(180000);

  test('Simulate 2 users: Team creation, RBAC roles, Realtime Tasks, and Completion', async ({ browser }) => {
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
    const authFlow = async (page: any, user: typeof userA) => {
      await page.goto('/login?signup=true', { waitUntil: 'networkidle', timeout: 60000 });
      
      await page.fill('input[id="email"]', user.email);
      await page.fill('input[id="password"]', user.password);
      await page.check('input[id="legal"]');
      await page.click('button[type="submit"]');
      
      // If we see "Check your email", we might be stuck. 
      // In local dev/testing, we expect auto-redirect to '/'
      try {
        await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
      } catch (e) {
        console.log("Likely waiting for email confirmation. Attempting direct login if auto-confirm failed.");
        await page.goto('/login');
        await page.fill('input[id="email"]', user.email);
        await page.fill('input[id="password"]', user.password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/$/);
      }
    };

    // 1. AUTH USER A (OWNER)
    console.log("Starting Auth for User A...");
    await authFlow(pageA, userA);
    console.log("User A Authed. Waiting for WelcomeOnboarding...");
    await expect(pageA.locator('text=Welcome to the Hub')).toBeVisible();

    // 2. CREATE TEAM (USER A)
    console.log("User A creating team...");
    await pageA.click('text=Create New Team');
    await pageA.fill('input[placeholder="e.g. Capstone Alpha"]', `Team ${sessionSuffix}`);
    await pageA.fill('textarea[placeholder="What is this team building?"]', 'E2E Realtime Test Project');
    await pageA.click('button:has-text("Start Team")');

    // Wait for Dashboard and grab Team ID
    console.log("Waiting for Dashboard for User A...");
    await expect(pageA.locator('text=TEAM:')).toBeVisible();
    
    const teamId = await pageA.evaluate(() => {
      const el = document.querySelector('#copy-team-id');
      // Look for UUID in the DOM
      return document.body.innerHTML.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    });

    console.log(`Detected Team ID: ${teamId}`);
    expect(teamId).toBeDefined();

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
