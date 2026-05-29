// playwright.config.ts
import path from 'path'
import { defineConfig, devices } from '@playwright/test';

const appRoot = path.resolve(__dirname, '..')
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    actionTimeout: 30000,
    navigationTimeout: 60000,
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: isCI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        {
          name: 'security',
          testMatch: /security-adversarial\.spec\.ts/,
          use: { ...devices['Desktop Firefox'] },
        },
      ],
  webServer: {
    command: 'npm run dev',
    cwd: appRoot,
    url: 'http://127.0.0.1:3001/login',
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
