import { test, expect } from '@playwright/test';

// E2E Accessibility test for KanbanBoard

test.describe('KanbanBoard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin'); // Adjust path if needed
  });

  test('Kanban board has region and columns with ARIA', async ({ page }) => {
    await expect(page.getByRole('region', { name: /kanban board/i })).toBeVisible();
    for (const col of ['To Do', 'In Progress', 'In Review', 'Done']) {
      await expect(page.getByRole('listitem', { name: new RegExp(col, 'i') })).toBeVisible();
    }
  });

  test('All cards are focusable and open modal with keyboard', async ({ page }) => {
    const cards = await page.getByRole('listitem', { name: /task:/i }).all();
    for (const card of cards) {
      await card.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('Modal has aria-modal and labelledby', async ({ page }) => {
    await page.getByRole('button', { name: /create task/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby');
  });
});
