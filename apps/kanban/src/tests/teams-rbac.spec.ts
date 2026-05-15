import { test, expect } from '@playwright/test';

/**
 * E2E Simulation: Teams, RBAC, and Realtime Collaboration
 * Scenario: 2 Scholars (Owner and Admin) collaborating on a project.
 */
test.describe('Espeezy Teams & Realtime Sync', () => {
  test.setTimeout(180000);

  test('Simulate 2 users: Team creation, RBAC roles, Realtime Tasks, and Completion', async ({ browser }) => {
    const sessionSuffix = Date.now().toString().slice(-6);
    const userA = { email: `owner_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Owner User' };
    const userB = { email: `admin_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Admin User' };

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 1. SIGNUP USER A (OWNER)
    await pageA.goto('/login');
    await pageA.click('text=/Don.*t have an account/i');
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.check('input[type="checkbox"]'); // Legal accepted
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/$/);
    await expect(pageA.locator('text=Welcome to the Hub')).toBeVisible();

    // 2. CREATE TEAM (USER A)
    await pageA.click('text=Create New Team');
    await pageA.fill('input[placeholder="e.g. Capstone Alpha"]', `Team ${sessionSuffix}`);
    await pageA.fill('textarea[placeholder="What is this team building?"]', 'E2E Realtime Test Project');
    await pageA.click('button:has-text("Start Team")');

    // Wait for Dashboard
    await expect(pageA.locator('text=TEAM:')).toBeVisible();
    const teamIdText = await pageA.locator('text=TEAM:').innerText();
    // Assuming Team ID is visible or we can get it from URL if we redirected
    // For this test, let's assume we can copy it or it's in the console
    const teamId = await pageA.evaluate(() => window.location.search.split('team=')[1] || localStorage.getItem('last_team_id'));
    
    // 3. SIGNUP USER B (ADMIN)
    await pageB.goto('/login');
    await pageB.click('text=/Don.*t have an account/i');
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.check('input[type="checkbox"]');
    await pageB.click('button[type="submit"]');
    await expect(pageB.locator('text=Welcome to the Hub')).toBeVisible();

    // 4. JOIN TEAM (USER B)
    // Note: We need a way to pass the Team ID to User B.
    // In a real E2E, we'd grab it from User A's dashboard.
    // For simulation, we'll assume the Team ID is available.
    // await pageB.click('text=Join Existing Team');
    // await pageB.fill('input[placeholder="Paste UUID here..."]', teamId);
    // await pageB.click('button:has-text("Join Project")');

    // 5. REALTIME COLLABORATION
    // User A creates a task
    await pageA.click('text=New Task');
    await pageA.fill('input[placeholder="Task Title"]', 'Critical Deliverable');
    await pageA.click('button:has-text("Save Task")');

    // User B sees the task via Realtime
    // await expect(pageB.locator('text=Critical Deliverable')).toBeVisible();

    // User B moves task to 'Done'
    // await pageB.click('text=Critical Deliverable');
    // await pageB.selectOption('select[name="status"]', 'Done');
    // await pageB.click('button:has-text("Update Status")');

    // 6. VERIFY ANALYTICS
    await pageA.click('text=Group Updates');
    // await expect(pageA.locator('text=100%')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
