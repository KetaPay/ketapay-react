import { open } from '@ketapay/checkout'
import { act, render, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKetaPayCheckout } from '../src/index.js'
import { CHECKOUT_URL, overlay, post } from './helpers.js'

describe('useKetaPayCheckout', () => {
  it('[RCT-001] open passes the same options to @ketapay/checkout and returns its handle', async () => {
    const onReady = vi.fn()
    const onPaid = vi.fn()
    const onClose = vi.fn()
    const { result } = renderHook(() => useKetaPayCheckout())

    let handle!: ReturnType<typeof open>
    act(() => {
      handle = result.current.open({ url: CHECKOUT_URL, onReady, onPaid, onClose })
    })

    expect(open).toHaveBeenCalledOnce()
    expect(vi.mocked(open).mock.calls[0]![0]).toMatchObject({ url: CHECKOUT_URL, onReady, onPaid })
    expect(handle).toBe(vi.mocked(open).mock.results[0]!.value)

    post('ready')
    post('paid')
    act(() => result.current.close())
    expect(onReady).toHaveBeenCalledOnce()
    expect(onPaid).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    await expect(handle.result).resolves.toBe('paid')
  })

  it('[RCT-001] open and close keep the same identity across renders', () => {
    const { result, rerender } = renderHook(() => useKetaPayCheckout())
    const first = result.current
    rerender()
    expect(result.current.open).toBe(first.open)
    expect(result.current.close).toBe(first.close)
  })

  it('[RCT-001] close does nothing when nothing is open', () => {
    const { result } = renderHook(() => useKetaPayCheckout())
    expect(() => result.current.close()).not.toThrow()
  })

  it('[RCT-003] unmounting while open closes the overlay', () => {
    const onClose = vi.fn()
    function Shop() {
      const checkout = useKetaPayCheckout()
      return <button onClick={() => checkout.open({ url: CHECKOUT_URL, onClose })}>Pay</button>
    }
    const view = render(<Shop />)
    act(() => view.getByText('Pay').click())
    expect(overlay()).not.toBeNull()

    view.unmount()
    expect(overlay()).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('[RCT-003] unmounting after the buyer closed it does nothing more', () => {
    const onClose = vi.fn()
    const { result, unmount } = renderHook(() => useKetaPayCheckout())
    act(() => void result.current.open({ url: CHECKOUT_URL, onClose }))
    post('closed')
    unmount()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
