import { test, expect } from '@playwright/test';

// E2E CRUD and drag-and-drop tests for KanbanBoard

test.describe('KanbanBoard CRUD & Drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin'); // Adjust path if needed
  });

  test('Create a new task', async ({ page }) => {
    await page.getByRole('button', { name: /create task/i }).click();
    await page.getByLabel('Title').fill('E2E Test Task');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('listitem', { name: /task: e2e test task/i })).toBeVisible();
  });

  test('Edit a task', async ({ page }) => {
    const card = page.getByRole('listitem', { name: /task: e2e test task/i });
    await card.click();
    await page.getByLabel('Title').fill('E2E Test Task Updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('listitem', { name: /task: e2e test task updated/i })).toBeVisible();
  });

  test('Delete a task', async ({ page }) => {
    const card = page.getByRole('listitem', { name: /task: e2e test task updated/i });
    await card.click();
    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('listitem', { name: /task: e2e test task updated/i })).not.toBeVisible();
  });

  test('Drag and drop task to another column', async ({ page }) => {
    // Create a task to drag
    await page.getByRole('button', { name: /create task/i }).click();
    await page.getByLabel('Title').fill('Drag Me');
    await page.getByRole('button', { name: /save/i }).click();
    const card = await page.getByRole('listitem', { name: /task: drag me/i });
    const inProgressCol = await page.getByRole('listitem', { name: /in progress column/i });
    await card.dragTo(inProgressCol);
    // Verify task is now in In Progress
    await expect(inProgressCol.getByRole('listitem', { name: /task: drag me/i })).toBeVisible();
  });
});
