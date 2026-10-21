import { open as openCheckout } from '@ketapay/checkout'
import type { CheckoutHandle, CheckoutOptions } from '@ketapay/checkout'
import { useCallback, useEffect, useRef } from 'react'

export interface KetaPayCheckout {
  /** Opens the checkout, exactly like `KetaPay.open` from `@ketapay/checkout`. Call it from an event handler. */
  open(options: CheckoutOptions): CheckoutHandle
  /** Closes the checkout this hook opened, if it's still showing. */
  close(): void
}

/** Opens KetaPay checkout from a component. A checkout still showing when the component unmounts is closed. */
export function useKetaPayCheckout(): KetaPayCheckout {
  const handle = useRef<CheckoutHandle | null>(null)

  useEffect(() => () => handle.current?.close(), [])

  const open = useCallback((options: CheckoutOptions) => {
    const opened = openCheckout({
      ...options,
      onClose: () => {
        if (handle.current === opened) handle.current = null
        options.onClose?.()
      },
    })
    handle.current = opened
    return opened
  }, [])

  const close = useCallback(() => handle.current?.close(), [])

  return { open, close }
}
