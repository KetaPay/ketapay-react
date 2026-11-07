import { resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { build } from 'esbuild'

// Served by Playwright itself. On localhost because a test checkout may be framed there with no setup; any
// other site must be on the business's allowed list (ENG-556).
export const SHOP = 'http://localhost:4599/'

export type ReactVersion = '18' | '19'

// React 18 has its own install in test/e2e/react18 (npm run test:e2e installs it first), because its
// react-dom can't share a package.json with React 19. esbuild swaps it in, for the package's own imports too.
const REACT_18 = resolve('test/e2e/react18/node_modules')
const REACT: Record<ReactVersion, Record<string, string>> = {
  '19': {},
  '18': { react: `${REACT_18}/react`, 'react-dom': `${REACT_18}/react-dom` },
}

const bundles = new Map<ReactVersion, Promise<string>>()

/** The page in main.tsx, bundled against dist/ so the tests run the code a business installs. */
function bundleShop(react: ReactVersion): Promise<string> {
  let bundle = bundles.get(react)
  if (!bundle) {
    bundle = build({
      entryPoints: ['test/e2e/shop/main.tsx'],
      alias: { '@ketapay/react': resolve('dist/index.js'), ...REACT[react] },
      bundle: true,
      write: false,
      format: 'iife',
      jsx: 'automatic',
      logLevel: 'error',
      define: { 'process.env.NODE_ENV': '"production"' },
    }).then((result) => result.outputFiles[0]!.text)
    bundles.set(react, bundle)
  }
  return bundle
}

export async function openShop(page: Page, url: string, react: ReactVersion) {
  const script = await bundleShop(react)
  await page.route(`${SHOP}shop.js`, (route) => route.fulfill({ contentType: 'text/javascript', body: script }))
  await page.route(SHOP, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script src="/shop.js"></script>',
    }),
  )
  await page.addInitScript((url) => {
    window.checkoutUrl = url
  }, url)
  await page.goto(SHOP)
}
