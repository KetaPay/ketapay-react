<!-- GENERATED: do not edit. Copied from documentation/openapi/public by `npm run sync-catalogue`. -->
<!-- sha256: f4bb65f14d1155119036968040c9d3345de8fbf110cf10cd48953a5f4ff25a78 -->

# KetaPay React SDK test catalogue

Every scenario below must be tested in `ketapay-react`. The rules are the same as the [server catalogue](SDK_TEST_CATALOGUE.md): tag tests with the ID in square brackets, one row is one behaviour, add rows with the next free ID, and never delete or renumber a row.

These tests run the built `@ketapay/react` in a small React page, in real browsers, against the staging API and checkout with sandbox keys. They only test what React adds. The overlay itself is covered by the BE2E rows in the [browser catalogue](SDK_BROWSER_TEST_CATALOGUE.md), which also holds the React unit rows (RCT).

## RE2E: React end to end against staging (sandbox keys)

| ID | Layer | Must hold |
| --- | --- | --- |
| RE2E-001 | e2e | `KetaPayButton` with a real `sk_test_` session opens the overlay on click, and `onReady` fires |
| RE2E-002 | e2e | Paying the sandbox bank transfer fires `onSuccess` once, and the session is `complete` through the API |
| RE2E-003 | e2e | Closing without paying fires `onClose`, and the button can open the overlay again |
| RE2E-004 | e2e | `useKetaPayCheckout().open()` from an app's own button opens the overlay, and `onReady` fires |
| RE2E-005 | e2e | Unmounting the component while the overlay is open closes it, and `onSuccess` doesn't fire later |
| RE2E-006 | e2e | An unknown token makes `onError` fire with `load_failed`, and the button can be clicked again |
| RE2E-007 | e2e | `KetaPayButton` with a `url` function gets the session from the shop's own server when clicked, then opens it |
| RE2E-008 | e2e | While that function is waiting the button is disabled and `aria-busy`, so a double click asks the server once and opens one checkout |
| RE2E-009 | e2e | When the shop's server fails, `onError` gets the error, no checkout opens, and the button can be clicked again |
| RE2E-010 | e2e | State set in `onSuccess` renders on the page, so the callbacks run inside the live React app |
| RE2E-011 | e2e | `useKetaPayCheckout().close()` called from code closes the checkout and fires `onClose` once |
| RE2E-012 | e2e | The whole suite also runs on React 18, the lowest supported version, and the page really runs the React version it was built for |
