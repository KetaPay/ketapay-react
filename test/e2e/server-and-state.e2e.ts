import type { Route } from '@playwright/test'
import { createSession, getSession } from './env.js'
import { checkout, events, expect, overlay, serverButton, SHOP, test } from './fixtures.js'

/** The shop's own endpoint that creates the session, answered by the test. Returns how often it was called. */
async function myServer(page: import('@playwright/test').Page, answer: (route: Route) => Promise<void>) {
  const calls = { count: 0 }
  await page.route(`${SHOP}session`, async (route) => {
    calls.count++
    await answer(route)
  })
  return calls
}

test("[RE2E-007] a url function gets the session from the shop's server on click, then opens it", async ({
  page,
  shop,
}) => {
  const session = await createSession()
  const calls = await myServer(page, (route) => route.fulfill({ json: { url: session.url } }))
  await shop('')
  expect(calls.count).toBe(0)

  await serverButton(page).click()

  await expect(overlay(page)).toBeVisible()
  await expect.poll(() => events(page)).toEqual(['ready'])
  expect(calls.count).toBe(1)
})

test('[RE2E-008] while the server is slow the button is busy, and a double click opens one checkout', async ({
  page,
  shop,
}) => {
  const session = await createSession()
  const calls = await myServer(page, async (route) => {
    await new Promise((done) => setTimeout(done, 1_500))
    await route.fulfill({ json: { url: session.url } })
  })
  await shop('')

  await serverButton(page).dblclick()
  await expect(serverButton(page)).toBeDisabled()
  await expect(serverButton(page)).toHaveAttribute('aria-busy', 'true')

  await expect.poll(() => events(page)).toEqual(['ready'])
  expect(calls.count).toBe(1)
  await expect(overlay(page)).toHaveCount(1)
  await expect(serverButton(page)).not.toHaveAttribute('aria-busy')
})

test("[RE2E-009] when the shop's server fails, onError gets it, nothing opens, and the button works again", async ({
  page,
  shop,
}) => {
  const calls = await myServer(page, (route) => route.fulfill({ status: 500, body: 'down' }))
  await shop('')

  await serverButton(page).click()
  await expect.poll(() => events(page)).toEqual(['error:My server answered 500'])
  await expect(overlay(page)).toHaveCount(0)
  await expect(serverButton(page)).toBeEnabled()

  await serverButton(page).click()
  await expect.poll(() => events(page)).toEqual(['error:My server answered 500', 'error:My server answered 500'])
  expect(calls.count).toBe(2)
})

test('[RE2E-010] state set in onSuccess renders on the page', async ({ page, shop }) => {
  const session = await createSession()
  await shop(session.url)
  await expect(page.getByText('Thanks, paid')).toHaveCount(0)
  await page.getByRole('button', { name: 'Pay with KetaPay', exact: true }).click()
  await expect.poll(() => events(page)).toContain('ready')

  await checkout(page)
    .getByRole('button', { name: /sent the money/ })
    .click()

  await expect(page.getByText('Thanks, paid')).toBeVisible()
  await expect.poll(async () => (await getSession(session.id)).status).toBe('complete')
})

test('[RE2E-011] close() from code closes the checkout and fires onClose once', async ({ page, shop }) => {
  const session = await createSession()
  await shop(session.url)
  await page.getByRole('button', { name: 'Pay from my own button' }).click()
  await expect.poll(() => events(page)).toEqual(['ready'])

  await page.evaluate(() => window.closeCheckout())

  await expect(overlay(page)).toHaveCount(0)
  expect(await events(page)).toEqual(['ready', 'closed'])
  // A second close with nothing open does nothing.
  await page.evaluate(() => window.closeCheckout())
  expect(await events(page)).toEqual(['ready', 'closed'])
  expect((await getSession(session.id)).status).toBe('open')
})

test('[RE2E-012] the page runs the React version its project was built for', async ({ page, shop, reactVersion }) => {
  const session = await createSession()
  await shop(session.url)
  expect(await page.evaluate(() => window.reactVersion)).toMatch(new RegExp(`^${reactVersion}\\.`))
  await page.getByRole('button', { name: 'Pay with KetaPay', exact: true }).click()
  await expect.poll(() => events(page)).toEqual(['ready'])
})
