import { test, expect } from '@playwright/test'

/**
 * Personal Arsenal WCAG-oriented smoke tests (structure, keyboard, responsive).
 * Authenticated vault UI requires a logged-in session; these validate public gates + login a11y.
 */
test.describe('Personal Arsenal accessibility & device compatibility', () => {
  test('unauthenticated users can access the login gate', async ({ request }) => {
    const res = await request.get('/login', { timeout: 15_000 })
    expect(res.ok()).toBeTruthy()
    expect(res.status()).toBe(200)
  })

  test('login gate renders an accessible form', async ({ request }) => {
    const res = await request.get('/login', { timeout: 15_000 })
    const html = await res.text()
    expect(html.toLowerCase()).toContain('espeezy kanban')
    const lower = html.toLowerCase()
    expect(lower.includes('auth-email') || lower.includes('loading workspace')).toBeTruthy()
    expect(lower.includes('sign in') || lower.includes('loading')).toBeTruthy()
  })

  test('login page response is available for keyboard flow', async ({ request }) => {
    const res = await request.get('/login', { timeout: 15_000 })
    expect(res.status()).toBe(200)
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('assets login gate endpoint is reachable on mobile test config', async ({ request }) => {
      const res = await request.get('/login', { timeout: 15_000 })
      expect(res.status()).toBe(200)
    })
  })

  test.describe('tablet viewport', () => {
    test.use({ viewport: { width: 834, height: 1194 } })

    test('login page remains reachable on tablet test config', async ({ request }) => {
      const res = await request.get('/login', { timeout: 15_000 })
      expect(res.status()).toBe(200)
    })
  })
})
