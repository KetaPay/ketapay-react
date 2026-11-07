// A business's React page, the way its docs say to write one: the built package, in StrictMode.
import { KetaPayButton, KetaPayCheckoutError, useKetaPayCheckout } from '@ketapay/react'
import { StrictMode, useEffect, useState, version } from 'react'
import { createRoot } from 'react-dom/client'

interface Callbacks {
  onReady: () => void
  onSuccess: () => void
  onClose: () => void
  onError: (error: unknown) => void
}

declare global {
  interface Window {
    checkoutUrl: string
    events: string[]
    reactVersion: string
    removeCheckout: () => void
    closeCheckout: () => void
  }
}

window.events = []
window.reactVersion = version

const describe = (error: unknown) =>
  error instanceof KetaPayCheckoutError ? error.code : error instanceof Error ? error.message : String(error)

/** The usual set-up: the button asks the shop's own server for a session when it's clicked. */
async function sessionFromMyServer(): Promise<string> {
  const res = await fetch('/session', { method: 'POST' })
  if (!res.ok) throw new Error(`My server answered ${res.status}`)
  return ((await res.json()) as { url: string }).url
}

function OwnButton({ callbacks }: { callbacks: Callbacks }) {
  const checkout = useKetaPayCheckout()
  // A real page would close it on a timer or a route change. The overlay covers the page, so the test calls this.
  useEffect(() => {
    window.closeCheckout = checkout.close
  }, [checkout.close])
  return (
    <button onClick={() => checkout.open({ url: window.checkoutUrl, ...callbacks })}>Pay from my own button</button>
  )
}

function Shop() {
  const [shown, setShown] = useState(true)
  const [paid, setPaid] = useState(false)
  useEffect(() => {
    window.removeCheckout = () => setShown(false)
  }, [])

  const callbacks: Callbacks = {
    onReady: () => window.events.push('ready'),
    onSuccess: () => {
      window.events.push('success')
      setPaid(true)
    },
    onClose: () => window.events.push('closed'),
    onError: (error) => window.events.push(`error:${describe(error)}`),
  }

  if (!shown) return <h1>Checkout removed</h1>
  return (
    <main>
      <h1>Shop</h1>
      {paid && <p role="status">Thanks, paid</p>}
      <KetaPayButton url={window.checkoutUrl} {...callbacks} />
      <KetaPayButton url={sessionFromMyServer} {...callbacks}>
        Pay via my server
      </KetaPayButton>
      <OwnButton callbacks={callbacks} />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shop />
  </StrictMode>,
)
