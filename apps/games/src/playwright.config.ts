import path from 'path'
import { defineConfig, devices } from '@playwright/test'

const appRoot = path.resolve(__dirname, '..')

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    cwd: appRoot,
    url: 'http://127.0.0.1:3002/login',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
