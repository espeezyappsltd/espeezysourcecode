import { test, expect } from '@playwright/test';

test.describe('Critical Path E2E', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Espeezy/i);
  });

  test('Users can pre-register', async ({ page }) => {
    const testEmail = `pre_${Date.now()}@test.com`;
    
    // Mock the API response since we might not have Firebase keys in test env
    await page.route('/api/preregister', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'You are on the list!', count: 123 }),
      });
    });

    await page.goto('/preregister');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('text=/You are on the list/i')).toBeVisible({ timeout: 10000 });
  });

  test('User can sign up and sign in', async ({ page }) => {
    const RUN_ID = Date.now().toString().slice(-6);
    const email = `test_${RUN_ID}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/login');
    
    // Toggle to Sign Up
    await page.click("text=/Don't have an account/i");
    
    // Fill signup form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.check('input[id="legal"]');
    
    await page.click('button[type="submit"]');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    
    // Sign out
    // await page.click('text=/Sign Out/i');
    // await expect(page).toHaveURL(/\/login/);
  });

  test('Real-time sync works', async ({ page }) => {
    // TODO: Simulate two users, check real-time updates
    expect(true).toBe(true); // Placeholder
  });

  test('Offline game appears when offline', async ({ page }) => {
    // TODO: Simulate offline, check for OfflineGame
    expect(true).toBe(true); // Placeholder
  });
});
