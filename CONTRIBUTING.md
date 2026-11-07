# Contributing

This library follows the KetaPay SDK standards (`documentation/openapi/public/SDK_STANDARDS.md`, section 3c for browser SDKs). It's a thin React layer over `@ketapay/checkout` (repo `ketapay-js`): the overlay, its messages, origins and focus handling all live there. A fix to how the checkout opens or behaves goes in `ketapay-js`, and reaches this package through its version range.

## Layout

```
src/
├── index.ts                   exports, plus KetaPayCheckoutError and the types re-exported from @ketapay/checkout
├── use-ketapay-checkout.ts    useKetaPayCheckout(): open and close, and closing on unmount
└── ketapay-button.tsx         KetaPayButton: a plain button over the hook, url as a string or a function
test/                          unit tests in jsdom against the real @ketapay/checkout (open wrapped in a spy); e2e/ runs real browsers through Playwright
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
npm run build && npm run test:e2e     # real browsers, needs the E2E settings below
```

`test/e2e/` drives Chromium, WebKit and an iPhone-sized WebKit through Playwright. Each test creates a fresh checkout session on the API with a sandbox key, serves a small React page bundled against `dist/`, opens the checkout from it and checks what a business would see. They only test what React adds; the overlay itself is covered in `ketapay-js`. The `chromium-react18` project runs the whole suite again with the page built on React 18, the lowest version we support; React 18 has its own install in `test/e2e/react18/` (its `react-dom` can't share a `package.json` with React 19), and `npm run test:e2e` installs it first.

Settings: `KETAPAY_E2E_BASE_URL` and `KETAPAY_E2E_SECRET_KEY` (see `test/e2e/env.ts`). The checkout URL the API returns must be reachable from the machine running the browsers.

The **E2E** workflow runs on every merge to `main`, on pull requests that change the SDK or spec, nightly and by hand, reading the settings from Infisical (`ketapay-sdks`, staging); until they exist it reports "not configured" and passes. **Publish to npm** runs it on the release tag and refuses a stable release unless it passed.

## The test catalogue

`spec/test-catalogue.md` and `spec/react-test-catalogue.md` are synced from `SDK_BROWSER_TEST_CATALOGUE.md` and `SDK_REACT_TEST_CATALOGUE.md` in `documentation/openapi/public/`. This package covers the `RCT` and `RE2E` rows and the package rows that apply to it (`BPKG-001`, `003`, `004`, `005`, `007`); the rest belong to `ketapay-js`. Tag each test with its ID in the test name. New scenario: add the row in the documentation repo first, `npm run sync-catalogue` here, then write the tagged test.

## Supported versions

React 18 or later (a peer dependency), TypeScript 5.0 or later, and the browsers `@ketapay/checkout` supports.

## Versioning and publishing

Same as every KetaPay SDK: conventional commits, Release Please release PR on every push to `main`, merging it tags the version, and the manual **Publish to npm** workflow (dudox only, `publish` environment) runs CI and E2E on the tag, smoke-tests the package and publishes with provenance. Pre-releases go under the `next` dist-tag. A new release is needed only for React changes, a newer `@ketapay/checkout` feature, or a wider version range.

Switches (repo variables): `RELEASES_ENABLED` and `NPM_PUBLISH_ENABLED`.

## Style

Prettier (`npm run format`): 120 columns, no semicolons, single quotes.

## Secrets and security

No secret ever goes in this repo. GitHub secret scanning with push protection and the **Secrets** CI check (gitleaks with KetaPay's patterns in `.gitleaks.toml`) enforce it. Vulnerabilities are reported privately (see SECURITY.md).
