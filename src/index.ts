declare const __SDK_VERSION__: string

/** The version of this library. */
export const version: string = __SDK_VERSION__

export { KetaPayButton } from './ketapay-button.js'
export type { KetaPayButtonProps } from './ketapay-button.js'
export { useKetaPayCheckout } from './use-ketapay-checkout.js'
export type { KetaPayCheckout } from './use-ketapay-checkout.js'
export { KetaPayCheckoutError } from '@ketapay/checkout'
export type { CheckoutHandle, CheckoutOptions, CheckoutResult, KetaPayCheckoutErrorCode } from '@ketapay/checkout'
