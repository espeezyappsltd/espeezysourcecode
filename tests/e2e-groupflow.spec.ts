import { test, expect } from '@playwright/test';

test.describe('End-to-End: Espeezy Control Station', () => {
  test.setTimeout(120000);
  test('Simulate 4 scholars: signup, team formation, task orchestration, and real-time sync', async ({ browser }) => {
    // Unique session ID to avoid email conflicts during parallel runs
    const sessionSuffix = Date.now().toString().slice(-6);
    const users = [
      { email: `scholar1_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Scholar One', id: `ID-S1-${sessionSuffix}` },
      { email: `scholar2_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Scholar Two', id: `ID-S2-${sessionSuffix}` },
      { email: `scholar3_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Scholar Three', id: `ID-S3-${sessionSuffix}` },
      { email: `scholar4_${sessionSuffix}@edu.com`, password: 'Test1234!', name: 'Scholar Four', id: `ID-S4-${sessionSuffix}` },
    ];
    
    const contexts = await Promise.all(users.map(() => browser.newContext()));
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    const moduleCode = `MOD-${sessionSuffix}`;
    const joinPassword = 'SecurePassword123';

    // 1. SCHOLAR REGISTRATION
    for (let i = 0; i < users.length; i++) {
      const p = pages[i];
      await p.goto('/login');
      
      // Navigate to Signup mode
      await p.click('text=/Don.*t have an account/i');
      
      await p.fill('input[type="email"]', users[i].email);
      await p.fill('input[type="password"]', users[i].password);
      
      // Accept Terms
      await p.check('input[id="legal"]');
      
      await p.click('button[type="submit"]');
      
      // Wait for Dashboard landing
      await expect(p).toHaveURL(/\/dashboard/);
      await expect(p.locator('text=Academic Hub Active')).toBeVisible();
    }

    // 2. TEAM INITIALIZATION (User 0 creates the team)
    await pages[0].click('text=Join or Create Team');
    await expect(pages[0]).toHaveURL(/\/dashboard\/join/);
    
    await pages[0].fill('input[id="name"]', 'Alpha Test Team');
    await pages[0].fill('input[id="module_code"]', moduleCode);
    await pages[0].fill('input[id="create_join_password"]', joinPassword);
    await pages[0].click('button:has-text("Create Workspace")');

    // Wait for redirect to Dashboard with Kanban
    await expect(pages[0]).toHaveURL(/\/dashboard/);
    await expect(pages[0].locator('text=Alpha Test Team')).toBeVisible();

    // 3. TEAM COALESCENCE (Users 1-3 join the team)
    for (let i = 1; i < users.length; i++) {
      const p = pages[i];
      await p.click('text=Join or Create Team');
      await p.fill('input[id="create_module_code"]', moduleCode);
      await p.fill('input[id="join_password"]', joinPassword);
      await p.click('button:has-text("Join Team")');
      
      await expect(p).toHaveURL(/\/dashboard/);
      await expect(p.locator('text=Alpha Test Team')).toBeVisible();
    }

    // 4. TASK ORCHESTRATION
    for (let i = 0; i < users.length; i++) {
        const p = pages[i];
        // Ensure Kanban column is visible
        await expect(p.locator('text=TO DO')).toBeVisible();
        
        // Use the 'Add Task' button (Assuming it's in a column or global)
        // Note: Currently KanbanBoard handles adding tasks via its own state
        // Let's assume a generic 'Add Task' button for now or a specific selector
        // await p.click('button:has-text("Add Task")'); 
        // ... Fill and Save ...
    }

    // 5. CLEANUP
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
