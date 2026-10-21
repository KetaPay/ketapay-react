export const CHECKOUT_URL = 'https://checkout.ketapay.com/ck_test_4f9a2c7e'

export const overlay = () => document.querySelector('[role="dialog"][aria-label="KetaPay checkout"]')

/** Delivers a message to the page as if the checkout frame had posted it. */
export function post(type: string, token = 'ck_test_4f9a2c7e') {
  const frame = document.querySelector('iframe')!
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { source: 'ketapay-checkout', type, token },
      origin: 'https://checkout.ketapay.com',
      source: frame.contentWindow,
    }),
  )
}
