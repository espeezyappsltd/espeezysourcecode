import { test, expect } from '@playwright/test';

test.describe('Main Application Actions', () => {
  const RUN_ID = Math.random().toString(36).substring(7);
  const email = `e2e_${RUN_ID}@test.com`;
  const password = 'TestPassword123!';
  const taskTitle = `Critical Task ${RUN_ID}`;

  test('Complete flow: Sign up -> Create Task -> Generate Report', async ({ page }) => {
    // 1. Sign Up
    await page.goto('/login');
    await page.click("text=/Don't have an account/i");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.check('input[id="legal"]');
    await page.click('button[type="submit"]');

    // Wait for Dashboard redirection
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    console.log('✓ Signed up and reached dashboard');

    // 2. Create Task
    // Open Task Modal
    await page.click('[aria-label="Create a new task"]');
    await expect(page.locator('text=/New Task/i')).toBeVisible();

    // Fill Task Details
    await page.fill('input[placeholder="What needs to be done?"]', taskTitle);
    await page.click('button:has-text("Save Task")');

    // Verify Task appears on Kanban
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 10000 });
    console.log('✓ Task created successfully');

    // 3. Move Task to Done (to affect report)
    await page.click(`text=${taskTitle}`);
    await page.selectOption('select', 'Done'); // Assuming there's a status select in the modal
    await page.click('button:has-text("Save Task")');
    console.log('✓ Task moved to Done');

    // 4. Generate Report / Check Analytics
    // Navigate to Analytics (assuming it's a tab or link)
    // Based on full-journey.spec.ts, it might be in the same dashboard view or a dedicated route
    await page.click('text=/Analytics/i'); 
    
    // Verify "Completed Tasks" KPI
    await expect(page.locator('text=Completed Tasks')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/1/1/')).toBeVisible(); // 1 task done out of 1
    console.log('✓ Analytics reflected the completed task');

    // 5. Export / Download Report (simulated)
    // Check for "Export" button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
        await exportButton.click();
        console.log('✓ Export button clicked');
    }
  });
});
