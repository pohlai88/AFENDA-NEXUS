All the feedback is valid and tightens the plan significantly. Let me research
the build outputs and API structure to incorporate these precisely.

Research build outputs and API structure

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/tsup.config.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/package.json)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/turbo.json)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/turbo.json)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/turbo.json)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/worker/package.json)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src)

Searched for regex `listen|fastify|createServer` (`**/apps/api/src/**`), 20
results

Searched for regex
`authUser|x-user-id|x-tenant-id|request\.headers|decorateRequest`
(`**/apps/api/src/**`), 20 results

Searched for regex `globalSetup|seedUser|test-signup|testUser`, 2 results

Searched for files matching `**/.github/workflows/*.yml`, 2 matches

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/middleware)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/routes)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/index.ts)

Read
[](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/middleware/auth.ts#1-1),
lines 1 to 120

Read
[](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/api/src/middleware/tenant-context.ts)

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/.github/workflows/ci.yml#1-1),
lines 1 to 120

Read
[](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/.github/workflows/preview.yml#1-1),
lines 1 to 120

Read [](file:///c%3A/AI-BOS/NEXUSCANON-AFENDA/apps/web/package.json#1-1), lines
1 to 60

Now I have all the precise details needed. Here is the fully revised plan
incorporating all the feedback:

---

## Plan: Playwright E2E Suite (Production-Hardened)

**TL;DR:** Add `apps/e2e` as a Turborepo package. Playwright starts **built**
servers (`next start` + `node dist/index.js`) via `webServer[]`, not dev
servers. Auth is established once in `globalSetup` using the API's own
dev-fallback mode (no token needed when `NEON_AUTH_BASE_URL` is unset +
`NODE_ENV=test`), then `storageState` is reused by all tests. An error-monitor
fixture fails on `console.error` / `pageerror` / HTTP ≥500 and soft-warns on a
`console.warn` denylist. A11y runs on key routes only.

---

**Steps**

**1. Scaffold `apps/e2e` package**

Create apps/e2e/package.json — name `@afenda/e2e`, private. Dev deps:

- `@playwright/test` (latest)
- `@axe-core/playwright`
- `axe-playwright`

Scripts:

- `"test:e2e": "playwright test"`
- `"test:e2e:report": "playwright show-report"`
- `"install:browsers": "playwright install chromium firefox"`

**2.
https://github.com/microsoft/playwright/tree/main/tests/library/playwright.config.ts#L153-L161**
— apps/e2e/playwright.config.ts

Key decisions from the feedback:

- **`webServer` (two entries, built servers — not dev):**
  - API:
    `command: 'node https://github.com/microsoft/playwright/tree/main/utils/generate_types/index.js#L570-L581'`,
    `cwd: '../api'`, `port: 3001`,
    `env: { PORT_API: '3001', NODE_ENV: 'test' }`,
    `reuseExistingServer: !process.env.CI`, `timeout: 30_000`
  - Web: `command: 'pnpm start'`, `cwd: '../web'`, `port: 3000`,
    `env: { NEXT_PUBLIC_API_URL: 'http://localhost:3001' }`,
    `reuseExistingServer: !process.env.CI`, `timeout: 60_000`
- **`globalSetup: './global-setup.ts'`** (seeds user, writes `storageState`
  once)
- **`projects`**: `chromium`, `firefox`, `Mobile Chrome` (devices['Pixel 5'])
- **`use`**: `baseURL: 'http://localhost:3000'`,
  `storageState: 'playwright/.auth/state.json'`, `trace: 'on-first-retry'`,
  `screenshot: 'only-on-failure'`, `video: 'on-first-retry'`
- **`reporter`**: `[['html'], ['list']]` locally; CI overrides via env to
  `[['blob'], ['github']]` — blob enables future sharding + merge
- **`fullyParallel: true`**, `forbidOnly: !!process.env.CI`,
  `retries: process.env.CI ? 2 : 0`
- **`outputDir: 'test-results'`**

**3. `global-setup.ts`** — apps/e2e/global-setup.ts

Runs once before all tests. Avoids per-test login overhead:

- Seeds a test user via `POST http://localhost:3001/auth/test/seed` — OR
  directly calls the API with `NODE_ENV=test` dev-fallback headers (the API
  trusts `x-tenant-id` + `x-user-id` directly when `NEON_AUTH_BASE_URL` is
  unset, granting admin)
- Uses a headless Chromium browser to navigate to `/login`, submit credentials,
  save `page.context().storageState()` to `playwright/.auth/state.json`
- Gitignore `playwright/.auth/` — CI regenerates it every run

A `global-teardown.ts` deletes the test tenant row from the DB (or calls a
cleanup endpoint).

**4. Error-monitor fixture** — apps/e2e/fixtures/error-monitor.ts

Separates signal from noise per the feedback:

**Hard failures (always):**

- `page.on('pageerror', ...)` — all unhandled JS exceptions
- `page.on('console', msg => msg.type() === 'error')` — `console.error` calls
- `page.on('response', res => res.status() >= 500)` — server errors

**Soft-warn denylist (fail only if matched):**

- `Warning: Each child in a list should have a unique "key"` — hydration key bug
- `Warning: Can't perform a React state update on an unmounted component` —
  memory leak
- `Warning: An update to .* inside a test was not wrapped in act(...)` — test
  infra leak
- `Warning: validateDOMNesting` — invalid HTML nesting
- `Warning: Prop \`className\` did not match` — hydration mismatch

All other `console.warn` calls are **captured and printed** in the test output
(as attachment) but do not fail the test.

After each test: check collected lists, throw a structured error listing every
violation with the URL it occurred on.

**5. Page Object Models** — apps/e2e/pages/

- LoginPage.ts — `goto()`, `login(email, pass)`, `assertError(msg)`
- AppShellPage.ts — `assertNoSidebarErrors()`, `switchTenant(name)`
- JournalsPage.ts — `create()`, `post()`, `reverse()`, `void()`
- PayablesPage.ts — `createInvoice()`, `approve()`, `pay()`
- ReportsPage.ts — `openTrialBalance()`, `assertBalanced()`, `exportPDF()`

**6. Test specs** — apps/e2e/tests/

| Spec                              | Error classes caught                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `auth/login.spec.ts`              | Redirect loops, session cookie missing, 401 surfaced in UI, form validation errors                                     |
| `auth/register.spec.ts`           | Registration 422 errors, onboarding blank-state                                                                        |
| `smoke/navigation.spec.ts`        | All 15 `(shell)/` routes: HTTP 200, zero `console.error`, no blank pages, no loading spinners stuck                    |
| `finance/journals.spec.ts`        | GL posting errors, balance validation failures, reversal state machine bugs                                            |
| `finance/payables.spec.ts`        | AP workflow errors, idempotency key collision (send twice, expect 200 not 500)                                         |
| `finance/reports.spec.ts`         | Report renders with data, export triggers download, no blank table                                                     |
| `errors/runtime-warnings.spec.ts` | Exhaustive crawl of all routes via error-monitor fixture — zero tolerance for `console.error` / `pageerror` / HTTP 500 |
| `a11y/accessibility.spec.ts`      | `checkA11y()` on: `/login`, `/`, `/finance/journals`, `/finance/reports`, `/settings`                                  |

The `a11y` spec is tagged `@nightly` and excluded from the default CI run filter
(`--grep-invert @nightly`). It runs as a separate nightly workflow later.

**7. tsconfig.json** — apps/e2e/tsconfig.json

Extends `../../packages/typescript-config/base.json`. Sets
`moduleResolution: "bundler"`, `paths` for `@/fixtures/*`, `@/pages/*`.

**8. Turbo pipeline** — apps/e2e/turbo.json

```
"test:e2e": {
  "dependsOn": ["@afenda/web#build", "@afenda/api#build"],
  "inputs": ["tests/**", "playwright.config.ts", "fixtures/**", "pages/**"],
  "outputs": ["playwright-report/**", "test-results/**"],
  "cache": false
}
```

`cache: false` — E2E results are always live. Caching is handled by `dependsOn`
build artifacts (`.next/**`, `dist/**`) staying cached in Turbo.

Add `"test:e2e": "turbo run test:e2e"` to root package.json.

**9. CI job** — ci.yml

Add a new `e2e` job after the existing `test` job:

- `needs: [quality, test]`
- `pnpm turbo build --filter=@afenda/api --filter=@afenda/web` (artifacts
  already cached from `test` job)
- `pnpm --filter @afenda/e2e exec playwright install chromium --with-deps`
- `pnpm test:e2e -- --reporter=blob`
- Upload `playwright-report/` and `test-results/` as artifacts on failure
- Set `PORT_API=3001`, `NODE_ENV=test`, no `NEON_AUTH_BASE_URL` (activates
  dev-fallback auth in API)

Gitignore additions: `playwright/.auth/`, `playwright-report/`, `test-results/`.

---

**Verification**

```bash
# First: build both servers
pnpm --filter @afenda/api build      # → apps/api/dist/index.js
pnpm --filter @afenda/web build      # → apps/web/.next/

# Install browsers
pnpm --filter @afenda/e2e run install:browsers

# Run full E2E suite
pnpm test:e2e

# Run only the error-detection sweep
pnpm --filter @afenda/e2e exec playwright test errors/runtime-warnings

# View HTML report
pnpm --filter @afenda/e2e run test:e2e:report
```

---

**Decisions**

- **Built servers over dev**: eliminates HMR rebuild races and noisy dev logs —
  the #1 flake source
- **`PORT_API=3001` explicit env**: `config.PORT_API` comes from
  `@afenda/platform`'s `loadConfig()`; the E2E env sets it explicitly to 3001,
  avoiding any config file lookup issues
- **Dev-fallback auth for `globalSetup`**: avoids needing a real Neon Auth JWT
  in test — the API already supports this when `NEON_AUTH_BASE_URL` is unset +
  `NODE_ENV=test`. This is not a test-only hack; it's the intended dev mode
- **Denylist for `console.warn`** rather than blanket warn-fail: Next.js 16 +
  React still emit benign deprecation notices; blanket fail would cause chronic
  noise
- **`blob` reporter in CI**: positions for sharding (parallelise across 4
  machines) without restructuring — just add `--shard=1/4` args and a
  `merge-reports` step
- **A11y gated to nightly**: prevents slow axe runs from blocking PR feedback
  loops
