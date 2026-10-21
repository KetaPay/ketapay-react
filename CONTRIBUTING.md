# Contributing

This library follows the KetaPay SDK standards (`documentation/openapi/public/SDK_STANDARDS.md`, section 3c for browser SDKs). It's a thin React layer over `@ketapay/checkout` (repo `ketapay-js`): the overlay, its messages, origins and focus handling all live there. A fix to how the checkout opens or behaves goes in `ketapay-js`, and reaches this package through its version range.

## Layout

```
src/
├── index.ts                   exports, plus KetaPayCheckoutError and the types re-exported from @ketapay/checkout
├── use-ketapay-checkout.ts    useKetaPayCheckout(): open and close, and closing on unmount
└── ketapay-button.tsx         KetaPayButton: a plain button over the hook, url as a string or a function
test/                          unit tests in jsdom against the real @ketapay/checkout (open wrapped in a spy)
scripts/                       catalogue sync and hash check, package smoke test, test report
```

The build marks the package `'use client'` for the Next.js App Router. Nothing may touch `window` or `document` during render.

## @ketapay/checkout before it's on npm

Until `@ketapay/checkout` is published, `package.json` points at `file:../ketapay-js`: clone both repos side by side and run `npm install && npm run build` in `ketapay-js` first. CI does the same. Once it's on npm, change the dependency to its version range (`^0.1.0-beta.1`, later `^1.0.0`) and drop the sibling checkout from the workflows. The publish workflow refuses to publish while the dependency is a local path.

## Pull requests and tests

Every change goes through a PR from a branch. CI runs on each PR, one check per kind of test: PR title (conventional commit), Secrets, Catalogue, Format/lint/types/audit, Unit tests (with coverage), Package smoke test, Test catalogue coverage.

**Before every push**, a git hook runs formatting, lint, types and unit tests and refuses the push if any fail. `npm install` turns it on.

```sh
npm test                 # unit tests (jsdom)
npm run test:coverage    # with coverage
npm run build && npm run smoke:pack   # the packed package in empty React 18 and 19 projects
```

## The test catalogue

`spec/test-catalogue.md` is synced from `documentation/openapi/public/SDK_BROWSER_TEST_CATALOGUE.md`. This package covers the `RCT` rows and the package rows that apply to it (`BPKG-001`, `003`, `004`, `005`, `007`); the rest belong to `ketapay-js`. Tag each test with its ID in the test name. New scenario: add the row in the documentation repo first, `npm run sync-catalogue` here, then write the tagged test.

## Supported versions

React 18 or later (a peer dependency), TypeScript 5.0 or later, and the browsers `@ketapay/checkout` supports.

## Versioning and publishing

Same as every KetaPay SDK: conventional commits, Release Please release PR on every push to `main`, merging it tags the version, and the manual **Publish to npm** workflow (dudox only, `publish` environment) runs CI on the tag, smoke-tests the package and publishes with provenance. Pre-releases go under the `next` dist-tag. A new release is needed only for React changes, a newer `@ketapay/checkout` feature, or a wider version range.

Switches (repo variables): `RELEASES_ENABLED` and `NPM_PUBLISH_ENABLED`.

## Style

Prettier (`npm run format`): 120 columns, no semicolons, single quotes.

## Secrets and security

No secret ever goes in this repo. GitHub secret scanning with push protection and the **Secrets** CI check (gitleaks with KetaPay's patterns in `.gitleaks.toml`) enforce it. Vulnerabilities are reported privately (see SECURITY.md).
