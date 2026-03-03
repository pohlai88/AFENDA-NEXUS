# tools/scripts

Ad-hoc scripts and CI gate enforcement for the AFENDA-NEXUS monorepo.

Scripts are standalone `.mjs` files — no build step, no published package. Every
gate script exits `0` (pass) or non-zero (fail) and is safe to run concurrently.

---

## Contents

- [Running CI Gates](#running-ci-gates)
- [Gate Groups](#gate-groups)
- [Gate Reference](#gate-reference)
  - [Accessibility & UI Quality](#accessibility--ui-quality)
  - [React / Next.js Patterns](#react--nextjs-patterns)
  - [API & Contract Integrity](#api--contract-integrity)
  - [Domain / Finance Invariants](#domain--finance-invariants)
  - [Database & Schema](#database--schema)
  - [Architecture & Monorepo Health](#architecture--monorepo-health)
  - [Coverage, Security & Performance](#coverage-security--performance)
- [Audit & Compliance Scripts](#audit--compliance-scripts)
- [Database CI Scripts](#database-ci-scripts)
- [Conventions](#conventions)

---

## Running CI Gates

### Recommended — Parallel Runner (5–10× faster)

```bash
# All 42 gates concurrently
pnpm ci:gates:parallel

# By group
pnpm ci:gates:parallel:arch        # Architecture & drift     (7 gates)
pnpm ci:gates:parallel:module      # Module boundary          (10 gates)
pnpm ci:gates:parallel:domain      # Domain invariants        (14 gates)
pnpm ci:gates:parallel:compliance  # Audit & security         (6 gates)
pnpm ci:gates:parallel:security    # Security & performance   (2 gates)

# Limit parallelism locally
node tools/scripts/run-gates-parallel.mjs --concurrency 4

# Help / list groups
node tools/scripts/run-gates-parallel.mjs --help
```

**Output:** Results table is printed to stdout. In GitHub Actions (`CI=true`),
error annotations are emitted and a markdown summary table is appended to
`$GITHUB_STEP_SUMMARY`. No local files are written.

**Windows / encoding fix:**

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node tools/scripts/run-gates-parallel.mjs
```

### Fast Pre-Commit Check

```bash
pnpm ci:gates:fast    # test-dir convention + db:ci + format check
```

### Full Sequential Run (legacy)

```bash
pnpm ci:gates         # all gates via && chain (slower, stops on first failure)
```

### Run a Single Gate

```bash
pnpm gate:<name>      # e.g. pnpm gate:a11y
pnpm gate:a11y:fix    # only gate with an --fix mode (rewrites source files)
```

---

## Gate Groups

| Group        | Count | Covers                                                   |
| ------------ | ----- | -------------------------------------------------------- |
| `arch`       | 7     | Turbo config, dependency graph, arch-guard, drift checks |
| `module`     | 10    | API/DB/worker/web boundaries, contracts, OpenAPI drift   |
| `domain`     | 14    | React keys, a11y, hydration, money/currency, loading     |
| `compliance` | 6     | AIS/SOX audits, Neon sync, dep audit, API smoke          |
| `security`   | 2     | Security headers, performance budget                     |

---

## Gate Reference

### Accessibility & UI Quality

| Script                        | pnpm command                   | Rule codes    | Description                                                                                                                                   |
| ----------------------------- | ------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `gate-a11y.mjs`               | `pnpm gate:a11y`               | A11Y-01–06    | WCAG 2.1 AA compliance — alt text, labels, aria attributes, heading order.                                                                    |
| `gate-a11y.mjs`               | `pnpm gate:a11y:fix`           | —             | Same as above with `--fix`: rewrites source files in place.                                                                                   |
| `gate-loading-skeleton.mjs`   | `pnpm gate:loading-skeleton`   | LS-GATE-01–05 | Enforces every `loading.tsx` uses the canonical `LoadingSkeleton` component with correct `role`/`sr-only` label.                              |
| `gate-nested-interactive.mjs` | `pnpm gate:nested-interactive` | NESTED-01     | Scans for nested interactive HTML patterns (`<a>` inside `<a>`, `<button>` inside `<a>`) that violate the HTML spec.                          |
| `gate-frontend-quality.mjs`   | `pnpm gate:frontend-quality`   | FE-GATE-01–05 | Five invariants: no raw UUID inputs, no currency defaults, forms use `zodResolver`, tables have captions, routes have error/loading siblings. |
| `gate-icon-integrity.mjs`     | `pnpm gate:icon-integrity`     | ICON-01–05    | Verifies every icon in `layout.tsx` metadata and `manifest.json` exists in `public/` with a valid binary signature.                           |

---

### React / Next.js Patterns

| Script                          | pnpm command                     | Rule codes      | Description                                                                                                                         |
| ------------------------------- | -------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `gate-hydration.mjs`            | `pnpm gate:hydration`            | HYDRO-01–03     | Scans `apps/web` for hydration-risk patterns: `Date.now()`, `Math.random()`, bare `window`/`document` in render scope.              |
| `gate-react-best-practices.mjs` | `pnpm gate:react-best-practices` | RBP-01–04       | Enforces Vercel React best practices: server-action auth, parallel awaits, `.toSorted()` immutability, conditional render patterns. |
| `gate-react-cache.mjs`          | `pnpm gate:react-cache`          | RBP-CACHE       | Enforces `React cache()` on server-side data fetchers to enable automatic request deduplication.                                    |
| `gate-react-keys.mjs`           | `pnpm gate:react-keys`           | REACT-KEY-01–02 | Validates all `.map()` JSX expressions have stable, non-index `key` props.                                                          |

---

### API & Contract Integrity

| Script                             | pnpm command                        | Rule codes  | Description                                                                                                                                         |
| ---------------------------------- | ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gate-api-module.mjs`              | `pnpm gate:api-module`              | —           | Checks every API route imports `requirePermission` and pulls types from `@afenda/contracts`.                                                        |
| `gate-api-smoke-ci.mjs`            | `pnpm gate:api-smoke-ci`            | SMOKE-01–04 | Offline-boots the API server and checks route count, `/health`, and the OpenAPI endpoint — no real DB required.                                     |
| `gate-contract-completeness.mjs`   | `pnpm gate:contract-completeness`   | CC-01–03    | Ensures every `POST`/`PUT`/`PATCH` route imports and applies a Zod schema from `@afenda/contracts`.                                                 |
| `gate-contract-drift-improved.mjs` | `pnpm gate:contract-drift-improved` | CDI-01–03   | Enhanced completeness check that distinguishes input schemas from response DTOs and scans Next.js route handlers.                                   |
| `gate-contract-response-drift.mjs` | `pnpm gate:contract-response-drift` | CRD-01–02   | Detects locally-defined response/view-model types in frontend query files that should be centralised in `@afenda/contracts`.                        |
| `gate-openapi-drift.mjs`           | `pnpm gate:openapi-drift`           | —           | Compares committed `docs/openapi.json` against a freshly generated spec. Fails on any diff. Scratch file: `node_modules/.cache/openapi-check.json`. |
| `gate-response-type-sot.mjs`       | `pnpm gate:response-type-sot`       | RST-01–03   | Enforces `ApiResult<T>`, `PaginatedResponse<T>`, and other response wrapper types are defined only in the canonical `lib/types.ts`.                 |

---

### Domain / Finance Invariants

| Script                       | pnpm command                  | Rule codes     | Description                                                                                                                      |
| ---------------------------- | ----------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `gate-currency-safety.mjs`   | `pnpm gate:currency-safety`   | —              | Prevents hardcoded `'USD'` strings or silent `?? 'USD'` fallbacks — currency must always flow from the data source.              |
| `gate-money-safety.mjs`      | `pnpm gate:money-safety`      | —              | Bans raw `BigInt(Math.round(x * 100))` in route files — all currency conversion must use `toMinorUnits()` from `@afenda/core`.   |
| `gate-status-types.mjs`      | `pnpm gate:status-types`      | —              | Checks port interface methods and entity definitions do not use bare `string` for status fields — union types or enums required. |
| `gate-kpi-stub-tracker.mjs`  | `pnpm gate:kpi-stub-tracker`  | KPI-STUB-01–03 | Detects KPI resolvers that return hardcoded/placeholder data instead of real API client calls.                                   |
| `gate-kernel-invariants.mjs` | `pnpm gate:kernel-invariants` | G-KRN-01–05    | Validates settings/admin route guards, schema exports, tenant context usage; forbids raw header reads outside the allowlist.     |
| `gate-identity-sot.mjs`      | `pnpm gate:identity-sot`      | —              | Enforces that only allowlisted middleware files (`auth.ts`, `tenant-context.ts`) may read `x-tenant-id` / `x-user-id` headers.   |

---

### Database & Schema

| Script                             | pnpm command                        | Rule codes | Description                                                                                                                            |
| ---------------------------------- | ----------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `gate-db-module.mjs`               | `pnpm gate:db-module`               | —          | Verifies every DB table in all migrations has `ENABLE ROW LEVEL SECURITY` and at least one `CREATE POLICY` (auth tables excluded).     |
| `gate-schema-conventions.mjs`      | `pnpm gate:schema-conventions`      | SC-01–08   | Lints Drizzle schema files for eight ERP conventions: RLS, tenant column, FK references, money helpers, `pkId`, timestamps, relations. |
| `gate-schema-entity-alignment.mjs` | `pnpm gate:schema-entity-alignment` | SEA-01–02  | Validates Drizzle schema columns align with domain entity interface properties — detects column↔property drift.                        |

---

### Architecture & Monorepo Health

| Script                      | pnpm command              | Rule codes  | Description                                                                                                                                                                                             |
| --------------------------- | ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gate-turbo-config.mjs`     | (via parallel runner)     | TURBO-01–07 | Validates `turbo.json` for invalid JSON, missing fields, bad task output configs, and incorrect `turbo` vs `turbo run` script usage.                                                                    |
| `gate-dependency-graph.mjs` | (via parallel runner)     | DEP-01–03   | Validates the monorepo dependency graph: no circular deps, no missing workspace deps, correct dep types, no undeclared cross-package imports.                                                           |
| `gate-web-module.mjs`       | `pnpm gate:web-module`    | W01–W23+    | Two-phase gate: runs `web-drift-check.mjs` for full architectural enforcement, then checks loading siblings, contract imports, route constants.                                                         |
| `gate-worker-module.mjs`    | `pnpm gate:worker-module` | —           | Checks every Tier-1 event in `EVENT_REGISTRY` has a handler in `event-handlers.ts` and the drain loop includes `correlationId`.                                                                         |
| `web-drift-check.mjs`       | `pnpm web:drift`          | W01–W23+    | Comprehensive frontend drift gate: Radix wrappers, Tailwind v4, `"use client"` discipline, hardcoded URL/color/route bans, Suspense discipline, metadata exports. Supports `--json` for machine output. |

---

### Coverage, Security & Performance

| Script                        | pnpm command                   | Rule codes    | Description                                                                                                                                                            |
| ----------------------------- | ------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gate-e2e-coverage-map.mjs`   | `pnpm gate:e2e-coverage-map`   | E2E-MAP-01–03 | Cross-references `page.tsx` files against Playwright specs — ensures every major route group has at least one E2E test.                                                |
| `gate-performance-budget.mjs` | `pnpm gate:performance-budget` | PERF-01–05    | Validates client/per-route bundle sizes, detects large un-lazy-loaded deps, enforces code splitting, finds duplicate dependencies.                                     |
| `gate-security-headers.mjs`   | `pnpm gate:security-headers`   | SEC-01–06     | Validates API route authentication, server-action authorisation, env var exposure, sensitive data logging, query parameterisation, and `next.config` security headers. |

---

## Audit & Compliance Scripts

| Script                       | pnpm command              | Description                                                                                                                                                                                            |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `audit-ais.mjs`              | `pnpm audit:ais`          | Audits all 41 AIS benchmark items from `docs/ais.finance.md` against the codebase with evidence scoring (L1–L5).                                                                                       |
| `audit-sox.mjs`              | `pnpm audit:sox`          | Checks 12 IT General Controls against the codebase for SOX readiness. WARN mode by default; add `--fail` to block CI.                                                                                  |
| `audit-feature-grid.mjs`     | `pnpm audit:feature-grid` | Audits the Module Map — validates domain configs, `buildFeatureMetrics`, navigation groups, feature ID consistency, and roadmap registrations.                                                         |
| `audit-finance-ui.mjs`       | `pnpm audit:finance`      | Detects stub reports, empty directories, overlong inline pages, and orphaned actions or API routes across the finance route/feature tree.                                                              |
| `generate-evidence-pack.mjs` | `pnpm audit:pack`         | Runs `audit:ais`, `audit:sox`, and `arch:guard` in JSON mode and bundles all results into a timestamped evidence pack at repo root (`evidence-pack-<date>.json`). Pass `--output <path>` to customise. |
| `export-audit-evidence.mjs`  | `pnpm audit:export`       | Exports audit log entries from Neon as JSON for compliance review. Required: `--tenant-id <uuid>`. Optional: `--from`, `--to`, `--output <file>`.                                                      |
| `neon-integration-sync.mjs`  | `pnpm neon:sync`          | Validates Neon integration by running `db:check` and `db:ci` to confirm Drizzle snapshot ↔ migration consistency.                                                                                      |

---

## Database CI Scripts

| Script            | pnpm command | Description                                                                                                                                                                                          |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-check-ci.mjs` | `pnpm db:ci` | Runs `drizzle-kit generate` in dry-run mode to detect schema changes without a matching migration. On failure, cleans up generated files and the matching snapshot only (other snapshots preserved). |

---

## Conventions

- **Naming:** use descriptive filenames, e.g.
  `2026-02-22-backfill-tenant-ids.mjs`
- **Runtime:** `node tools/scripts/<name>.mjs` — no build step, ESM only
- **No side effects:** gate scripts are read-only; they never mutate source
  files (except `gate-a11y --fix`)
- **No local file output:** gates write to stdout only; `$GITHUB_STEP_SUMMARY`
  is written only in GitHub Actions (`CI=true`)
- **Exit codes:** `0` = pass, `1` = gate failure, `2` = runner crash

---

## CI Validation Diagnosis

Audit date: **2026-03-03**. Each script is classified **HEALTHY** / **WARN** /
**BUG**.

Legend:

- `BUG` — logic error that produces incorrect results today
- `FALSE-POS` — valid code is incorrectly flagged as a violation
- `FALSE-NEG` — a real violation is silently missed
- `PERF` — unnecessary file I/O or redundant scans
- `ERROR-HANDLING` — missing try/catch that would crash the gate process
- `REDUNDANCY` — overlapping checks with another gate running in parallel

---

### run-gates-parallel.mjs — WARN

| Category        | Issue                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MISSING-FEATURE | No per-gate timeout — a hanging gate (e.g. `neon:sync` waiting for network) blocks the entire runner indefinitely                                                          |
| REDUNDANCY      | `gate-contract-completeness` and `gate-contract-drift-improved` both run in the `module` group and scan largely overlapping files — combined latency even in parallel mode |
| MISSING-FEATURE | Help text says "domain: 14 gates" but the GATES array has 15+ entries; `gate-nested-interactive` was added later and the help text was not updated                         |
| ERROR-HANDLING  | A gate killed with SIGKILL (OOM in CI) reports `ok: false` but outputs an empty string with no diagnostic message                                                          |

---

### gate-turbo-config.mjs — WARN

| Category       | Issue                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERROR-HANDLING | `checkPackageJsonScripts()` calls `readFileSync(rootPkgPath)` with no try/catch                                                                                 |
| FALSE-POS      | TURBO-07 flags any root script starting with `build`/`lint`/`test`/`typecheck` that does not include `turbo` — legitimate `vitest`/`tsc` delegations are caught |
| FALSE-NEG      | Only reads root `turbo.json`; per-package overrides in `apps/*/turbo.json` are not analysed                                                                     |

---

### gate-dependency-graph.mjs — WARN

| Category       | Issue                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG      | Import scanner only catches `@afenda/`-scoped imports; workspace packages under other scopes or bare imports are silently skipped |
| PERF           | `checkMissingDeps()` re-reads every source file per package independently — no shared read cache                                  |
| REDUNDANCY     | `checkCircularDeps()` starts a fresh DFS from every package, potentially reporting the same cycle from both ends                  |
| ERROR-HANDLING | Silent `catch (_) => {}` in `walk()` swallows all I/O errors including permission errors                                          |

---

### gate-a11y.mjs — WARN

| Category  | Issue                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERF      | `walkTsx(WEB_SRC)` called twice — second time only for a file count at the end of the summary line                                                                      |
| FALSE-NEG | A11Y-02 regex only matches single-line `<button>…<Icon/>…</button>`; Prettier-formatted multiline patterns are missed                                                   |
| FALSE-NEG | A11Y-04 context window fixed at 6 lines — deeply nested multi-line form controls with their `<label>` farther away are incorrectly flagged                              |
| FALSE-POS | A11Y-05 fires on every `<Icon/>` regardless of whether the parent already has `aria-label`; the parent-line check covers only one line                                  |
| BUG       | Auto-fix (`--fix`) applies multiple patterns sequentially on the same file; regex indices become stale after the first replacement, potentially producing broken output |

---

### gate-hydration.mjs — WARN

| Category  | Issue                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FALSE-NEG | `window`/`document` at render-top-level is mentioned in the header but not implemented                                                                                               |
| FALSE-NEG | `new Date().toLocaleDateString()` and `toLocaleTimeString()` are equally hazardous but not covered                                                                                   |
| BUG       | Hook-depth tracker counts raw `(` `)` characters — a JSX string `placeholder="(required)"` shifts the depth counter, causing real violations after the string to be silently skipped |
| FALSE-NEG | Only scans `.tsx` files; `.ts` utility files used in RSC render paths are excluded                                                                                                   |

---

### gate-frontend-quality.mjs — WARN

| Category       | Issue                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| PERF           | `findFiles()` called 5–6 separate times over overlapping directory trees                                |
| FALSE-NEG      | FE-GATE-01 only scans `/forms/` and `/blocks/` — UUID inputs in `/components/` are missed               |
| FALSE-NEG      | FE-GATE-03 only checks `/forms/`; `useForm` in feature roots or blocks bypasses the `zodResolver` check |
| FALSE-POS      | `?? 'USD'` fires on comments and string literals (no comment-line filtering before the regex test)      |
| ERROR-HANDLING | `readdirSync(APP_DIR)` in FE-GATE-05 has no try/catch — throws if `apps/web/src/app` does not exist     |

---

### gate-react-best-practices.mjs — WARN

| Category  | Issue                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | RBP-02: `if (content.includes('Promise.all')) continue` skips the **entire file** — a file that wraps some awaits in `Promise.all` but has other sequential awaits is never checked |
| FALSE-POS | RBP-04: `{ isLoading && <X> }` flagged even when `isLoading` is always boolean                                                                                                      |
| PERF      | `asyncFiles` and `jsxFiles` built from separate `findFiles()` sweeps; `useServerFiles` reads matched files twice                                                                    |
| FALSE-POS | RBP-03 `.sort(` fires on any method chain (`Object.keys(x).sort()`) regardless of React state context                                                                               |

---

### gate-react-cache.mjs — WARN

| Category  | Issue                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BUG       | Already-cached detection: `content.includes('cache')` — the word `cache` in a variable name, comment, or import alias marks the file as exempt, creating false negatives |
| FALSE-POS | Pattern B matches `export const CACHE_TTL = 300` — any exported constant triggers the "missing cache()" warning                                                          |
| PERF      | Two independent `findFiles(WEB_SRC)` scans; both should share the same file list                                                                                         |

---

### gate-react-keys.mjs — WARN

| Category  | Issue                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | Regex misses destructured params (`.map(({ id }) => <Elem`) and two-param variants (`.map((item, idx) => <Elem`) |
| FALSE-NEG | Only matches uppercase JSX elements; `.map(item => <div` / `<span` patterns ignored                              |
| FALSE-NEG | Key-prop lookahead only scans 5 lines — multiline elements with deeply nested opening tags exceed this window    |

---

### gate-api-module.mjs — HEALTHY

| Category        | Issue                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| MISSING-FEATURE | Only scans `packages/modules/finance/src/slices` — other future domain modules are not covered |
| FALSE-NEG       | Checks for the literal string `extractIdentity`; a renamed import alias bypasses the check     |

---

### gate-api-smoke-ci.mjs — WARN

| Category        | Issue                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| FALSE-POS       | SMOKE-03 route count includes commented-out `registerXRoutes(` and `app.register(` calls                                             |
| FALSE-NEG       | SMOKE-04 checks for string presence of `"cors"`, `"auth"`, `"rateLimit"` — an import present but disabled or never registered passes |
| MISSING-FEATURE | No actual server boot — this is a static text scan, not a real smoke test; import-phase errors go undetected                         |

---

### gate-contract-completeness.mjs — WARN

| Category   | Issue                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| FALSE-POS  | `usesSchema` matches `.parse(` globally — `path.parse()`, `JSON.parse()`, any `.parse()` fires         |
| FALSE-POS  | `schema:` key match fires on any JS object literal with a `"schema"` key (e.g. a logger config)        |
| REDUNDANCY | ~80% of logic duplicated in `gate-contract-drift-improved.mjs`; both run in parallel on the same files |

---

### gate-contract-drift-improved.mjs — WARN

| Category   | Issue                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| REDUNDANCY | Duplicates ~80% of `gate-contract-completeness.mjs`; both gate run in parallel                                                      |
| BUG        | A type like `CreateInvoiceQuery` (an input) ends with `Query` — heuristic marks it as response-only and the file passes incorrectly |
| FALSE-NEG  | Requires exact casing `export async function POST\|PUT\|PATCH`; custom handler wrappers are not checked                             |

---

### gate-contract-response-drift.mjs — WARN

| Category       | Issue                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG      | Only follows `export * from '...'` re-exports; named re-exports with aliases (`export { Foo as Bar } from`) are invisible                                         |
| ERROR-HANDLING | `readFileSync` inside `extractContractExports()` has no try/catch — a broken re-export path silently returns an empty Set, causing every query type to be flagged |

---

### gate-openapi-drift.mjs — **BUG**

| Category       | Issue                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**        | Comparison uses raw string equality (`committed !== fresh`) — JSON key-ordering differences between generation runs produce false failures with no real drift |
| **BUG**        | Temp spec written to `node_modules/.cache/openapi-check.json` — `node_modules` may not exist in Docker/pnpm virtual-store setups                              |
| ERROR-HANDLING | If `gen-openapi.mjs` exits non-zero, gate exits 1 with no cleanup; the partial temp file remains on disk                                                      |

---

### gate-response-type-sot.mjs — HEALTHY

| Category        | Issue                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| MISSING-FEATURE | `WRAPPER_TYPES` is a hardcoded array — new canonical wrapper types added to `lib/types.ts` must be manually added here or they are never protected |

---

### gate-currency-safety.mjs — WARN

| Category  | Issue                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | Only scans files inside `/repos/` subdirectory of `SLICES_DIR`; mapper, transformer, and service files are excluded |
| FALSE-NEG | Only checks `SLICES_DIR` (finance module); other domain modules are out of scope                                    |
| FALSE-POS | `?? 'USD'` fires on commented-out lines (no comment-skip guard)                                                     |

---

### gate-money-safety.mjs — WARN

| Category  | Issue                                                                                      |
| --------- | ------------------------------------------------------------------------------------------ |
| FALSE-NEG | Only catches `* 100` coefficient; `* 100n`, `* 1e2`, `* MINOR_UNIT_FACTOR` bypass the gate |
| PERF      | `findFiles(SLICES_DIR, /\.ts$/)` called twice with overlapping patterns                    |

---

### gate-status-types.mjs — WARN

| Category   | Issue                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG  | Only checks `/ports/` and `/entities/`; `status: string` in services, repos, and contracts is not caught                            |
| FALSE-POS  | Fires on method return-type annotations like `function getStatus(): { status: string }` that are not entity properties              |
| REDUNDANCY | Variable is named `warnings` (leftover from when the gate was advisory) but the gate is a hard fail — misleading during maintenance |

---

### gate-kpi-stub-tracker.mjs — WARN

| Category  | Issue                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUG       | `braceDepth` tracker cuts the resolver body short on `(() => ({ ... }))` — inline object literals reset depth at the wrong boundary, causing `hasApiCall` to miss calls later in the resolver |
| FALSE-NEG | `resolverBody.includes('_dashSummary')` is a hardcoded implementation-specific bypass — any resolver containing that identifier auto-passes regardless of whether the API call was removed    |
| FALSE-NEG | API calls inside imported helper functions are invisible (imports not followed)                                                                                                               |

---

### gate-kernel-invariants.mjs — WARN

| Category       | Issue                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG      | G-KRN-01: a purely static page with no `createApiClient` call silently passes because `fetchesApi` is false                            |
| FALSE-NEG      | G-KRN-05: only scans `apps/api/src/routes/` — handlers in `apps/api/src/handlers/` or plugins are not checked for raw header reads     |
| ERROR-HANDLING | Missing-file errors in G-KRN-03/04 are individually try/caught but the root cause (file absent) is not surfaced in the failure message |

---

### gate-identity-sot.mjs — WARN

| Category  | Issue                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | `apps/web/src` is excluded from the scan — a web API route handler reading `x-tenant-id` directly is not detected |
| FALSE-NEG | Header names stored in constants (`const TENANT_HEADER = 'x-tenant-id'`) bypass the literal-string scan           |

---

### gate-db-module.mjs — HEALTHY

| Category  | Issue                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | Only checks `CREATE TABLE` statements — views, materialised views, and partitioned table children are never validated for RLS |
| FALSE-NEG | `CREATE POLICY` detection assumes the table name follows immediately after `ON` with no inline comments or newlines           |

---

### gate-schema-conventions.mjs — **BUG**

| Category  | Issue                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**   | `readFileSync(join(SCHEMA_DIR, 'relations.ts'))` has no try/catch — if `relations.ts` is absent the entire gate crashes with an unhandled ENOENT   |
| FALSE-NEG | SC-03 negative lookahead only scans to end-of-line; a multiline column definition with `.references()` on the next line produces a false violation |
| FALSE-POS | SC-05 monetary-column check matches on column name substrings — non-monetary columns like `risk_exposure_level varchar` are incorrectly flagged    |

---

### gate-schema-entity-alignment.mjs — WARN

| Category  | Issue                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUG       | `entityToTableName` appends `'s'` — irregular plurals (Category→categories, Entry→entries, Policy→policies) produce wrong table names, so those entities are always reported as unmatched |
| BUG       | `pendingTableName` is reset to null on any line that doesn't match `.table(` — a split definition with a blank or comment line between `= erpSchema` and `.table(` is never captured      |
| FALSE-NEG | The 40% match-rate is the only hard failure — 39% accuracy silently passes; column-level mismatches are warnings only and never block CI                                                  |

---

### gate-web-module.mjs — WARN

| Category        | Issue                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ERROR-HANDLING  | `readFileSync` inside `checkFeatureContracts()` has no per-file try/catch — a single unreadable file crashes Phase 2                                                                             |
| MISSING-FEATURE | Phase 2 G2 (feature modules missing contract imports) is advisory-only (`advisories`, not `violations`) and never contributes to the exit code — violations are silently noted but never fail CI |

---

### gate-worker-module.mjs — **BUG**

| Category  | Issue                                                                                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**   | `readFileSync(eventsFile)`, `readFileSync(handlersFile)`, `readFileSync(drainFile)` all called without try/catch — a renamed file crashes the gate with an unhandled ENOENT                                                      |
| BUG       | `EVENT_REGISTRY` regex uses non-greedy `[\s\S]*?` and terminates at the first `};` in the file — a nested object literal ending with `};` causes the parser to capture only a partial registry and miss subsequent tier-1 events |
| FALSE-NEG | Handler registration check uses `handlersContent.includes(evt)` — an event type mentioned only in a comment inside `event-handlers.ts` is counted as registered                                                                  |

---

### gate-e2e-coverage-map.mjs — WARN

| Category        | Issue                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG       | Only extracts E2E URLs from literal string arguments to `page.goto()` / `toHaveURL()`; specs navigating via `ROUTES.*` constants are completely invisible |
| FALSE-NEG       | `toHaveURL(/regex/)` produces garbled path strings that never match any route                                                                             |
| MISSING-FEATURE | `.e2e-exempt-routes` uses em-dash as separator — easy to mistype as regular dash with no validation warning                                               |

---

### gate-performance-budget.mjs — **BUG**

| Category  | Issue                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**   | PERF-02 reads `server/pages-manifest.json` — this is the Pages Router manifest; the project uses App Router, so this file never exists and PERF-02 is silently a no-op |
| PERF      | PERF-03 calls `walkFiles()` O(n_libs × n_files) times; PERF-04 calls `walkFiles()` O(n_components × n_files) times — the file list should be built once                |
| BUG       | `next.config` path is hardcoded as `next.config.mjs` but the project uses `next.config.ts`; the security-header check silently skips                                   |
| FALSE-NEG | When `.next` build directory does not exist, PERF-01 and PERF-02 are skipped but PERF-03/04 still run, producing confusing mixed-mode output                           |

---

### gate-security-headers.mjs — **BUG**

| Category   | Issue                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**    | SEC-05 regex flags Drizzle's `sql\`WHERE id = ${userId}\`` tagged template literals as raw SQL injection — these are parameterised and safe; produces false positives on valid Drizzle code |
| **BUG**    | SEC-06 reads `next.config.mjs` but the project uses `next.config.ts` — the security-header check silently does nothing                                                                      |
| FALSE-POS  | SEC-01 auth check: any variable or function named `session` satisfies the auth presence check even if it provides no actual authentication                                                  |
| FALSE-NEG  | SEC-04 only checks `console.log()` — `console.debug()`, `console.info()`, `console.warn()` with sensitive data are not flagged                                                              |
| REDUNDANCY | SEC-01/SEC-02 overlap significantly with `gate-react-best-practices.mjs` RBP-01; both gates check server-action auth independently                                                          |

---

### gate-loading-skeleton.mjs — WARN

| Category  | Issue                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FALSE-POS | LS-GATE-04 Skeleton count regex `/<Skeleton[\s/]/g` matches `<SkeletonTable`, `<SkeletonCard`, and any other component starting with "Skeleton"                                      |
| FALSE-NEG | ARIA checks (LS-GATE-02/03) are only enforced when `!importsShared`; files importing from a composite allowlist component but not the shared loading-skeleton bypass all ARIA checks |

---

### gate-icon-integrity.mjs — WARN

| Category  | Issue                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG | ICON-04 SVG validity only runs on `metadataIcons`; icons referenced exclusively in `manifest.json` are never validated |
| PERF      | `manifest.json` parsed twice — once for ICON-02 and again for ICON-05; parsed result should be shared                  |

---

### gate-nested-interactive.mjs — **BUG**

| Category  | Issue                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG**   | Multi-line self-closing interactive tags (`Link` / `button` spanning multiple lines, closed with `/>`) are pushed onto the stack but never popped — all subsequent siblings are reported as false-positive nested-interactive violations |
| FALSE-NEG | JSX comment blocks `{/* ... */}` — any opening tag on the line the comment closes may be misread as a real element                                                                                                                       |

---

### gate-openapi-drift.mjs — BUG (repeated for quick reference)

See [above](#gate-openapi-driftmjs----bug).

---

### check-test-directory.mjs — WARN

| Category        | Issue                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| MISSING-FEATURE | Only scans `packages/modules/finance/src`; `apps/api/src`, `apps/worker/src`, and other `packages/*/src` directories are not checked |
| BUG             | Windows UNC network paths (`\\server\share`) produce a malformed ROOT after the drive-letter strip                                   |
| ERROR-HANDLING  | `stat(absDir)` failure exits the loop for that directory with only `console.warn` — a typo'd path in `SCAN_DIRS` silently passes     |

---

### db-check-ci.mjs — WARN

| Category        | Issue                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BUG             | The "dry-run" generate writes real migration files then deletes them — if the process is killed between write and delete (CI timeout, OOM), leftover files corrupt the drizzle directory |
| BUG             | `const { unlinkSync } = await import('node:fs')` — dynamic import is unnecessary; `unlinkSync` is available via the static import already at the top                                     |
| MISSING-FEATURE | No check that `drizzle.config.ts` exists before exec; a misconfigured project receives an opaque drizzle-kit error                                                                       |

---

### neon-integration-sync.mjs — HEALTHY

| Category        | Issue                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| FALSE-NEG       | Env-file parsing uses a simple `key=value` regex — multi-line values, values with embedded `=`, and `export KEY=val` shell variables are not handled |
| MISSING-FEATURE | `--env` flag validation is optional; pooler endpoint and SSL mode checks are silently skipped unless the flag is explicitly passed                   |

---

### Summary

| Verdict                                  | Scripts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG** (breaking)                       | `gate-openapi-drift`, `gate-schema-conventions`, `gate-worker-module`, `gate-performance-budget`, `gate-security-headers`, `gate-nested-interactive`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **WARN** (silent errors / coverage gaps) | `gate-turbo-config`, `gate-dependency-graph`, `gate-a11y`, `gate-hydration`, `gate-frontend-quality`, `gate-react-best-practices`, `gate-react-cache`, `gate-react-keys`, `gate-api-smoke-ci`, `gate-contract-completeness`, `gate-contract-drift-improved`, `gate-contract-response-drift`, `gate-currency-safety`, `gate-money-safety`, `gate-status-types`, `gate-kpi-stub-tracker`, `gate-kernel-invariants`, `gate-identity-sot`, `gate-schema-entity-alignment`, `gate-web-module`, `gate-e2e-coverage-map`, `gate-loading-skeleton`, `gate-icon-integrity`, `check-test-directory`, `db-check-ci`, `neon-integration-sync`, `run-gates-parallel` |
| **HEALTHY**                              | `gate-api-module`, `gate-response-type-sot`, `gate-db-module`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Highest priority fixes:**

1. `gate-security-headers` SEC-05 — false-positive on all Drizzle `sql\`\``
   template usage (blocks CI on valid code)
2. `gate-security-headers` SEC-06 — silently does nothing (`next.config.mjs` vs
   `next.config.ts`)
3. `gate-performance-budget` PERF-02 — Pages Router manifest check silently
   no-ops on an App Router project
4. `gate-openapi-drift` — raw string comparison, unreliable in any
   non-deterministic generation
5. `gate-worker-module` — unhandled ENOENT crashes gate process on file rename
6. `gate-schema-conventions` — unhandled ENOENT on absent `relations.ts` crashes
   gate process
7. `gate-nested-interactive` — multi-line self-closing tags produce cascading
   false positives throughout each file
