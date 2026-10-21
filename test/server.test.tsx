// @vitest-environment node
// Server rendering (Next.js, Remix): no window or document.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KetaPayButton, useKetaPayCheckout } from '../src/index.js'

describe('server rendering', () => {
  it('[RCT-004] renders the button and a component using the hook without throwing', () => {
    function Shop() {
      const checkout = useKetaPayCheckout()
      return <a onClick={() => checkout.open({ url: 'https://checkout.ketapay.com/ck_1' })}>Pay</a>
    }
    expect(typeof window).toBe('undefined')
    const html = renderToString(
      <>
        <KetaPayButton url="https://checkout.ketapay.com/ck_1" className="btn" />
        <Shop />
      </>,
    )
    expect(html).toContain('<button class="btn" type="button">Pay with KetaPay</button>')
    expect(html).toContain('Pay</a>')
  })
})
