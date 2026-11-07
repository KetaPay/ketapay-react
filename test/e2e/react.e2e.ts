import { createSession, getSession, payWithTestHelper } from './env.js'
import { checkout, events, expect, overlay, payButton, test } from './fixtures.js'

test('[RE2E-001] KetaPayButton opens a real session in the overlay on click, and onReady fires', async ({
  page,
  shop,
}) => {
  const session = await createSession()
  await shop(session.url)
  await expect(overlay(page)).toHaveCount(0)

  await payButton(page).click()

  await expect(overlay(page)).toBeVisible()
  await expect.poll(() => events(page)).toEqual(['ready'])
})

test('[RE2E-002] paying the sandbox bank transfer fires onSuccess once and completes the session', async ({
  page,
  shop,
}) => {
  const session = await createSession()
  await shop(session.url)
  await payButton(page).click()
  await expect.poll(() => events(page)).toContain('ready')

  // Bank transfer is the e2e business's only method, so the page goes straight to the account.
  await checkout(page)
    .getByRole('button', { name: /sent the money/ })
    .click()

  await expect.poll(() => events(page)).toContain('success')
  await expect.poll(async () => (await getSession(session.id)).status).toBe('complete')
  expect((await events(page)).filter((event) => event === 'success')).toHaveLength(1)
})

test('[RE2E-003] closing without paying fires onClose, and the button opens the overlay again', async ({
  page,
  shop,
}) => {
  // ENG-652: @ketapay/checkout beta.2 (on npm) hides its close button once ready, so desktop has none.
  // Remove this line in the PR that raises the @ketapay/checkout range: a test.fail test that passes fails the run.
  test.fail(true, 'ENG-652: no close button on desktop with @ketapay/checkout beta.2')
  const session = await createSession()
  await shop(session.url)
  await payButton(page).click()
  await expect.poll(() => events(page)).toEqual(['ready'])

  // Asserted first, so a missing button fails the test rather than timing it out (test.fail ignores timeouts).
  const close = page.getByRole('button', { name: 'Close checkout' })
  await expect(close).toBeVisible()
  await close.click()
  await expect(overlay(page)).toHaveCount(0)
  expect(await events(page)).toEqual(['ready', 'closed'])
  expect((await getSession(session.id)).status).toBe('open')

  await payButton(page).click()
  await expect(overlay(page)).toBeVisible()
  await expect.poll(() => events(page)).toEqual(['ready', 'closed', 'ready'])
})

test("[RE2E-004] useKetaPayCheckout().open() from an app's own button opens the overlay", async ({ page, shop }) => {
  const session = await createSession()
  await shop(session.url)

  await page.getByRole('button', { name: 'Pay from my own button' }).click()

  await expect(overlay(page)).toBeVisible()
  await expect.poll(() => events(page)).toEqual(['ready'])
})

test("[RE2E-005] unmounting closes the overlay, and a later payment doesn't fire onSuccess", async ({ page, shop }) => {
  const session = await createSession()
  await shop(session.url)
  await payButton(page).click()
  await expect.poll(() => events(page)).toEqual(['ready'])

  await page.evaluate(() => window.removeCheckout())
  await expect(page.getByRole('heading', { name: 'Checkout removed' })).toBeVisible()
  await expect(overlay(page)).toHaveCount(0)
  await expect(page.locator('iframe[title="KetaPay checkout"]')).toHaveCount(0)

  await payWithTestHelper(session.id)
  await expect.poll(async () => (await getSession(session.id)).status).toBe('complete')
  // Nothing to poll for when the point is that nothing arrives: leave a message time to land.
  await page.waitForTimeout(2_000)
  expect(await events(page)).toEqual(['ready', 'closed'])
})

test('[RE2E-006] an unknown token fires onError with load_failed, and the button can be clicked again', async ({
  page,
  shop,
}) => {
  const session = await createSession()
  // The same checkout origin, but a token that was never issued: the page that loads never says ready.
  await shop(session.url.replace(/[^/]+$/, 'cs_test_never_issued'))
  await payButton(page).click()
  await expect.poll(() => events(page)).toEqual(['error:load_failed', 'closed'])
  await expect(overlay(page)).toHaveCount(0)

  await expect(payButton(page)).toBeEnabled()
  await payButton(page).click()
  await expect(overlay(page)).toBeVisible()
  await expect.poll(() => events(page)).toEqual(['error:load_failed', 'closed', 'error:load_failed', 'closed'])
})
