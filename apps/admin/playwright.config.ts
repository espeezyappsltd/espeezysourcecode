import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3004/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
