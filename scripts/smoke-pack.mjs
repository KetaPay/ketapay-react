// Packs the library exactly as npm would publish it, installs the .tgz into an empty React project (React 18
// and 19) and uses it the way a business would: server rendering, a bundler, a browser page and TypeScript.
// Run after `npm run build` here and in @ketapay/checkout. Exits non-zero on the first failure.
//
// [BPKG-001] installs and works as ESM, in a bundler and in a browser
// [BPKG-003] the public types compile (TypeScript 5.0 and current)
// [BPKG-004] the artifact contains only built code, licence and readme
// [BPKG-005] only @ketapay/checkout as a dependency, React as a peer
// [BPKG-007] the reported version equals the published version
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const CHECKOUT_URL = 'https://checkout.ketapay.com/ck_test_smoke'
const root = resolve('.')
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const checkoutDir = realpathSync(join(root, 'node_modules/@ketapay/checkout'))
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const check = (ok, message) => {
  if (!ok) {
    console.error(`FAIL ${message}`)
    process.exit(1)
  }
  console.log(`ok   ${message}`)
}

const dir = mkdtempSync(join(tmpdir(), 'ketapay-react-smoke-'))
try {
  const tgz = join(dir, run('npm', ['pack', '--pack-destination', dir, '--silent'], root).trim())
  const checkoutTgz = join(dir, run('npm', ['pack', '--pack-destination', dir, '--silent'], checkoutDir).trim())

  // [BPKG-004] only built code, licence, readme and package.json
  const files = run('tar', ['-tzf', tgz], dir).trim().split('\n')
  const stray = files.filter((f) => !/^package\/(dist\/.+|LICENSE|README\.md|package\.json)$/.test(f))
  check(
    stray.length === 0,
    `[BPKG-004] package holds only dist, LICENSE, README.md (stray: ${stray.join(', ') || 'none'})`,
  )

  // [BPKG-005] @ketapay/checkout is the only dependency; React comes from the app
  const packed = JSON.parse(run('tar', ['-xzOf', tgz, 'package/package.json'], dir))
  const deps = Object.keys(packed.dependencies ?? {})
  const peers = Object.keys(packed.peerDependencies ?? {})
  check(
    deps.join() === '@ketapay/checkout' && peers.join() === 'react',
    `[BPKG-005] dependencies: ${deps.join(', ')}; peers: ${peers.join(', ')}`,
  )
  check(
    readFileSync(join(root, 'dist/index.js'), 'utf8').startsWith("'use client'"),
    '[BPKG-001] marked as a client module for the Next.js App Router',
  )

  for (const react of ['18', '19']) {
    const app = join(dir, `react-${react}`)
    mkdirSync(app)
    writeFileSync(
      join(app, 'package.json'),
      // The checkout package comes from its own .tgz, as it will from npm.
      JSON.stringify({ name: 'shop', private: true, type: 'module', overrides: { '@ketapay/checkout': checkoutTgz } }),
    )
    run(
      'npm',
      [
        'install',
        '--silent',
        '--no-audit',
        '--no-fund',
        tgz,
        `react@${react}`,
        `react-dom@${react}`,
        `@types/react@${react}`,
        `@types/react-dom@${react}`,
        'typescript@5.0.4',
        'typescript-current@npm:typescript@5.9.3',
      ],
      app,
    )

    // [BPKG-001] [BPKG-007] ESM in Node: server rendering, and the version export
    writeFileSync(
      join(app, 'server.mjs'),
      `import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { KetaPayButton, version } from '@ketapay/react'
console.log(JSON.stringify({ html: renderToString(createElement(KetaPayButton, { url: '${CHECKOUT_URL}' })), version }))`,
    )
    const server = JSON.parse(run('node', ['server.mjs'], app))
    check(server.html.includes('Pay with KetaPay</button>'), `[BPKG-001] React ${react}: renders on the server`)
    check(
      server.version === version && packed.version === version,
      `[BPKG-007] React ${react}: reports version ${version}`,
    )

    // [BPKG-001] bundled with esbuild and clicked in a browser page: the checkout opens
    writeFileSync(
      join(app, 'shop.jsx'),
      `import { createRoot } from 'react-dom/client'
import { KetaPayButton } from '@ketapay/react'
createRoot(document.getElementById('root')).render(<KetaPayButton url="${CHECKOUT_URL}" />)`,
    )
    const bundled = await build({
      entryPoints: [join(app, 'shop.jsx')],
      bundle: true,
      write: false,
      platform: 'browser',
      jsx: 'automatic',
      define: { 'process.env.NODE_ENV': '"production"' },
      absWorkingDir: app,
      logLevel: 'error',
    })
    const page = new JSDOM('<!doctype html><div id="root"></div>', {
      url: 'https://shop.example/cart',
      runScripts: 'dangerously',
    })
    page.window.eval(bundled.outputFiles[0].text)
    const button = await waitFor(() => page.window.document.querySelector('button'))
    button.click()
    const iframe = await waitFor(() => page.window.document.querySelector('[role="dialog"] iframe'))
    check(
      iframe.src.startsWith(CHECKOUT_URL),
      `[BPKG-001] React ${react}: bundled with esbuild, the button opens the checkout`,
    )

    // [BPKG-003] the public types compile, old and new TypeScript, both resolutions
    writeFileSync(
      join(app, 'shop.tsx'),
      `import { KetaPayButton, useKetaPayCheckout, type CheckoutResult, type KetaPayButtonProps } from '@ketapay/react'
export function Shop() {
  const checkout = useKetaPayCheckout()
  const pay = async (): Promise<CheckoutResult> => checkout.open({ url: '${CHECKOUT_URL}', onSuccess() {} }).result
  const props: KetaPayButtonProps = { url: async () => '${CHECKOUT_URL}', className: 'btn', onError: (e: unknown) => e }
  return (
    <>
      <KetaPayButton {...props}>Pay</KetaPayButton>
      <button onClick={() => void pay()}>Pay my way</button>
    </>
  )
}
// @ts-expect-error url is required
export const broken = <KetaPayButton />
`,
    )
    for (const [label, bin] of [
      ['5.0', 'node_modules/typescript/bin/tsc'],
      ['current', 'node_modules/typescript-current/bin/tsc'],
    ]) {
      for (const resolution of ['bundler', 'nodenext']) {
        const mod = resolution === 'bundler' ? 'esnext' : 'nodenext'
        run(
          'node',
          [
            bin,
            '--noEmit',
            '--strict',
            '--skipLibCheck',
            '--jsx',
            'react-jsx',
            '--lib',
            'es2020,dom',
            '--module',
            mod,
            '--moduleResolution',
            resolution,
            'shop.tsx',
          ],
          app,
        )
        console.log(`ok   [BPKG-003] React ${react}: types compile with TypeScript ${label}, ${resolution} resolution`)
      }
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}

async function waitFor(find) {
  for (let i = 0; i < 50; i++) {
    const found = find()
    if (found) return found
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error('timed out')
}
