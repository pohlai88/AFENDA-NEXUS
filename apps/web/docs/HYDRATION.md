# Hydration: detection and prevention

## Command palette fix (stability)

The header trigger for the command palette (Cmd/Ctrl+K) was causing a hydration error: server and client could render different labels. Fixed by:

- **Single source of truth:** `shell.tokens.ts` now exports `COMMAND_PALETTE_ARIA_LABEL` and `COMMAND_PALETTE_TRIGGER_PLACEHOLDER`. The header uses these for both desktop and mobile buttons.
- **Platform key (⌘ vs Ctrl):** The only part that legitimately differs after hydration is the shortcut key. `KbdGroup` for that segment has `suppressHydrationWarning` so React does not treat the platform key as a mismatch.

## How we identify hydration issues

### 1. E2E (runtime)

**Existing:** `apps/e2e/tests/errors/runtime-warnings.spec.ts` runs against key routes. The `error-monitor` fixture (auto-attached) fails the run if the console reports:

- `Hydration failed because...`
- `Text content did not match`
- `Prop \`className\` did not match`

So any hydration error that surfaces in the browser will fail the E2E run. Run:

```bash
pnpm test:e2e
# or: pnpm --filter @afenda/e2e test:e2e
```

### 2. ESLint (static)

**Added:** In `apps/web/eslint.config.js`, `no-restricted-syntax` now warns on:

- `Date.now()` in render
- `new Date().toLocaleString()` in render  
- `Math.random()` in render

These patterns commonly cause server/client mismatch. The rule message points to `.agents/skills/next-best-practices/hydration-error.md`.

### 3. Gate (static)

**Added:** `pnpm gate:hydration` runs `tools/scripts/gate-hydration.mjs`, which scans `apps/web/src` (excluding `__tests__` and `*.test.tsx`) for:

- `Date.now()`
- `new Date().toLocaleString()`
- `Math.random()`

Use it locally before pushing. It is not wired into `module:gates` by default so existing violations do not block CI; you can add it to `module:gates` once the codebase is clean.

```bash
pnpm gate:hydration
```

## Auto-fix

Hydration issues usually need code changes (e.g. move time/random into `useEffect`, use `useId()`, or add `suppressHydrationWarning` where the difference is intentional). ESLint can warn; fixing is manual. The command palette fix is the pattern: constants for copy, `suppressHydrationWarning` only on the part that intentionally differs after hydration.

## References

- `.agents/skills/next-best-practices/hydration-error.md` — causes and fixes
- `apps/e2e/fixtures/error-monitor.ts` — E2E denylist (hydration patterns)
- `apps/web/docs/DEV-STARTUP-SLOW.md` — dev performance and proxy
