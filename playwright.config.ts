// E2E: the built package in a small React page in real browsers, opening checkouts created on the KetaPay API
// with a sandbox key. Settings come from Infisical (project ketapay-sdks, environment staging), see test/e2e/env.ts.
import { defineConfig, devices } from '@playwright/test'
import type { ShopOptions } from './test/e2e/fixtures.js'

export default defineConfig<ShopOptions>({
  testDir: 'test/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Paying and closing go through a different layout on a phone, which ketapay-js covers (BE2E-005).
    { name: 'iphone', use: { ...devices['iPhone 13'] }, grepInvert: /\[RE2E-(002|003|010)\]/ },
    // React 18 is the lowest version we support: the whole suite again with the page built on it (RE2E-012).
    { name: 'chromium-react18', use: { ...devices['Desktop Chrome'], reactVersion: '18' } },
  ],
})
