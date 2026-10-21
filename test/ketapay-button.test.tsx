import { open } from '@ketapay/checkout'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KetaPayButton, KetaPayCheckoutError } from '../src/index.js'
import { CHECKOUT_URL, overlay, post } from './helpers.js'

describe('KetaPayButton', () => {
  it('[RCT-002] opens the checkout on click and passes its callbacks through', async () => {
    const onReady = vi.fn()
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    render(<KetaPayButton url={CHECKOUT_URL} onReady={onReady} onSuccess={onSuccess} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Pay with KetaPay' }))
    await waitFor(() => expect(overlay()).not.toBeNull())
    expect(vi.mocked(open).mock.calls[0]![0]).toMatchObject({ url: CHECKOUT_URL, onReady, onSuccess })

    post('ready')
    post('paid')
    post('closed')
    expect(onReady).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(overlay()).toBeNull()
  })

  it('[RCT-002] gets the URL from a function on click, disabled while it waits', async () => {
    let resolve!: (url: string) => void
    const getUrl = vi.fn(() => new Promise<string>((r) => (resolve = r)))
    render(<KetaPayButton url={getUrl}>Pay ₦15,000</KetaPayButton>)
    const button = screen.getByRole('button', { name: 'Pay ₦15,000' })

    fireEvent.click(button)
    expect(getUrl).toHaveBeenCalledOnce()
    expect(button).toHaveProperty('disabled', true)
    expect(button.getAttribute('aria-busy')).toBe('true')

    await act(async () => resolve(CHECKOUT_URL))
    expect(overlay()).not.toBeNull()
    expect(button).toHaveProperty('disabled', false)
    expect(button.hasAttribute('aria-busy')).toBe(false)
  })

  it('[RCT-005] reports a bad URL or a failed url function to onError, or logs it without one', async () => {
    const onError = vi.fn()
    const { rerender } = render(<KetaPayButton url="https://evil.example/ck_1" onError={onError} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(KetaPayCheckoutError)
    expect(overlay()).toBeNull()

    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    rerender(<KetaPayButton url={() => Promise.reject(new Error('session failed'))} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(log).toHaveBeenCalledWith(new Error('session failed')))
  })

  it('[RCT-005] reports a checkout that does not load to onError', async () => {
    const onError = vi.fn()
    const onClose = vi.fn()
    render(<KetaPayButton url={CHECKOUT_URL} onError={onError} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(overlay()).not.toBeNull())

    vi.useFakeTimers()
    act(() => {
      document.querySelector('iframe')!.dispatchEvent(new Event('load'))
      vi.advanceTimersByTime(8_000)
    })
    vi.useRealTimers()
    expect(overlay()).toBeNull()
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0]![0]).toMatchObject({ name: 'KetaPayCheckoutError', code: 'load_failed' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('[RCT-002] is a plain button that takes the usual button props', () => {
    render(<KetaPayButton url={CHECKOUT_URL} className="btn" id="pay" disabled data-testid="pay" />)
    const button = screen.getByTestId('pay')
    expect(button.className).toBe('btn')
    expect(button.id).toBe('pay')
    expect(button.getAttribute('type')).toBe('button')
    expect(button).toHaveProperty('disabled', true)
  })

  it('[RCT-003] unmounting the button while open closes the overlay', async () => {
    const view = render(<KetaPayButton url={CHECKOUT_URL} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(overlay()).not.toBeNull())
    view.unmount()
    expect(overlay()).toBeNull()
  })
})
