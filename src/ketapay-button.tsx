import type { CheckoutOptions } from '@ketapay/checkout'
import { useState, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { useKetaPayCheckout } from './use-ketapay-checkout.js'

export interface KetaPayButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>, Omit<CheckoutOptions, 'url'> {
  /**
   * The checkout session `url` from your server, or a function that gets one when the button is clicked
   * (for example by calling your own endpoint that creates the session).
   */
  url: string | (() => string | Promise<string>)
  /**
   * Getting the URL failed, it isn't a KetaPay checkout, or the checkout didn't load (a `KetaPayCheckoutError`
   * with `code` `load_failed`). Without it, the error is logged.
   */
  onError?: (error: unknown) => void
}

/** A plain button that opens KetaPay checkout. Unstyled: pass `className` or `style` like any button. */
export function KetaPayButton({
  url,
  onReady,
  onSuccess,
  onClose,
  onError,
  children = 'Pay with KetaPay',
  disabled,
  type = 'button',
  ...button
}: KetaPayButtonProps) {
  const checkout = useKetaPayCheckout()
  const [loading, setLoading] = useState(false)

  function report(error: unknown) {
    if (onError) onError(error)
    else console.error(error)
  }

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const target = typeof url === 'function' ? await url() : url
      checkout.open({ url: target, onReady, onSuccess, onError: report, onClose })
    } catch (error) {
      report(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      {...button}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
