import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The real @ketapay/checkout, with open wrapped in a spy so tests can see exactly what reached it.
vi.mock('@ketapay/checkout', async (original) => {
  const actual = await original<typeof import('@ketapay/checkout')>()
  return { ...actual, open: vi.fn(actual.open) }
})

afterEach(() => {
  if (typeof document === 'undefined') return // node environment tests (server rendering, catalogue)
  cleanup()
  // Anything a test left open is closed, so overlays never leak between tests.
  document
    .querySelectorAll('[role="dialog"]')
    .forEach(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
})
