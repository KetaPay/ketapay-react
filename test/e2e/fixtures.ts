import { test as base, type Page } from '@playwright/test'
import { configured } from './env.js'
import { openShop, type ReactVersion } from './shop/serve.js'

export interface ShopOptions {
  /** The React the shop page is bundled with: 19 by default, 18 in the `-react18` project (RE2E-012). */
  reactVersion: ReactVersion
}

export const test = base.extend<ShopOptions & { shop: (url: string) => Promise<void> }>({
  reactVersion: ['19', { option: true }],
  shop: async ({ page, reactVersion }, provide) => {
    await provide((url) => openShop(page, url, reactVersion))
  },
})

test.skip(!configured, 'E2E is not configured (KETAPAY_E2E_BASE_URL, KETAPAY_E2E_SECRET_KEY)')

export { expect } from '@playwright/test'
export { SHOP } from './shop/serve.js'

export const events = (page: Page) => page.evaluate(() => window.events)
export const checkout = (page: Page) => page.frameLocator('iframe[title="KetaPay checkout"]')
export const overlay = (page: Page) => page.getByRole('dialog', { name: 'KetaPay checkout' })
export const payButton = (page: Page) => page.getByRole('button', { name: 'Pay with KetaPay', exact: true })
export const serverButton = (page: Page) => page.getByRole('button', { name: 'Pay via my server' })
