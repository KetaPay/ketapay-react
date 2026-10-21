# KetaPay checkout for React

A hook and a button that open KetaPay checkout over your app, so buyers pay into escrow without leaving it. Built on [`@ketapay/checkout`](https://github.com/KetaPay/ketapay-js), which does the work; this package only fits it to React.

## How it works

1. **Your server** creates a checkout session with your secret key (through [`@ketapay/node`](https://github.com/KetaPay/ketapay-node), [`ketapay/ketapay-php`](https://github.com/KetaPay/ketapay-php) or the API) and sends its `url` to your app.
2. **Your app** opens it with `<KetaPayButton>` or `useKetaPayCheckout()`. The checkout opens over your page: a centred window on a computer, the whole screen on a phone.
3. The buyer pays. You get `onSuccess`, and the `escrow.funded` webhook on your server. Trust the webhook (or fetch the session) before you ship anything: a browser callback can't prove a payment.

## Install

```sh
npm install @ketapay/react
```

React 18 or later.

## The button

```tsx
import { KetaPayButton } from '@ketapay/react'

export function PayButton() {
  return (
    <KetaPayButton
      url={() =>
        fetch('/api/checkout', { method: 'POST' })
          .then((r) => r.json())
          .then((s) => s.url)
      }
      onSuccess={() => router.push('/orders')}
      onError={() => toast('Checkout could not load. Please try again.')}
      className="btn btn-primary"
    >
      Pay safely with KetaPay
    </KetaPayButton>
  )
}
```

- `url`: the session's `url`, or a function that gets one when the button is clicked. The button is disabled (and `aria-busy`) while it waits.
- `onReady`, `onSuccess`, `onClose`: as in `@ketapay/checkout`.
- `onError`: getting the URL failed, it isn't a KetaPay checkout, or the checkout didn't load (`code` `load_failed`). Without it, the error is logged.
- Anything else a `<button>` takes (`className`, `style`, `disabled`, `id`...). It has no styles of its own. The default label is "Pay with KetaPay".

## The hook

For your own button, a menu item, or opening it after something else happens:

```tsx
import { useKetaPayCheckout } from '@ketapay/react'

function Checkout({ url }: { url: string }) {
  const checkout = useKetaPayCheckout()

  async function pay() {
    const result = await checkout.open({ url, onReady: () => track('checkout_shown') }).result
    if (result === 'success') showThankYou()
  }

  return <MyButton onClick={pay}>Pay now</MyButton>
}
```

`open` takes the same options as `KetaPay.open` and returns the same `{ close, result }`. `close()` closes it. A checkout still showing when the component unmounts is closed for you.

## Next.js and server rendering

Both are client components (the package is marked `'use client'`), and nothing touches the browser until the checkout is opened, so they render on the server without errors. Call `open` from an event handler or an effect, never during render.

## Branding

The checkout shows your business's logo and colour from your KetaPay settings. There are no styling options for the checkout itself; style the button however you like.

## Errors and everything else

Errors (`KetaPayCheckoutError`, with `code` `invalid_url`, `not_in_browser` or `load_failed`), Content Security Policy, the sandbox and supported browsers are the same as [`@ketapay/checkout`](https://github.com/KetaPay/ketapay-js#readme). `KetaPayCheckoutError` and the types are re-exported from here.

## Licence

MIT
