# Web App Audit & Cleanup Report

**Generated**: 2026-02-26  
**Scope**: `apps/web/src/` — 260+ source files  
**Stack**: Next.js (catalog), React 19, Tailwind CSS v4, shadcn/ui, Neon Auth, Sentry, Framer Motion

---

## Executive Summary

| Area | Status | Issues Found |
|---|---|---|
| **Orphan Components** | 🔴 | 4 completely dead files |
| **Orphan Hooks** | 🔴 | 5 hooks exported but never imported |
| **Dead Libraries** | 🟡 | 3 lib modules with zero or self-only consumers |
| **Phantom Dependencies** | 🟡 | 3 packages in package.json with zero source imports |
| **Legacy Patterns** | 🟡 | Data-table legacy Column API, redundant switchers |
| **Performance Config** | 🟢 | Solid — minor improvements possible |
| **Stability** | 🟢 | Full error boundary + loading.tsx coverage |

---

## 1. Orphan / Dead Components (safe to delete)

### 1a. `components/erp/document-viewer.tsx` — ☠️ DEAD
- **0 importers** outside its own file
- Imports `scroll-area`, `sheet`, `tabs` — the *only* consumer of `sheet` outside `sidebar.tsx`
- **Action**: Delete file

### 1b. `components/motion/animated-containers.tsx` + `components/motion/index.ts` — ☠️ DEAD
- `animated-containers.tsx` is only imported by `motion/index.ts` (barrel)
- `motion/index.ts` barrel has **0 importers** anywhere in the codebase
- `lib/motion.ts` (367-line variant library) is only imported by `animated-containers.tsx`
- **The entire motion component system is unused** — all framer-motion usage goes directly through the library
- **Action**: Delete `components/motion/` directory entirely

### 1c. `components/ui/radio-group.tsx` — ☠️ DEAD
- **0 importers** anywhere in the codebase
- The `@radix-ui/react-radio-group` package dependency is only used by this file
- **Action**: Delete file. Consider removing `@radix-ui/react-radio-group` from package.json

---

## 2. Orphan Hooks (exported but never imported)

All hooks below are exported via `hooks/index.ts` barrel but the barrel itself has **0 importers**. Individual hooks are imported via direct paths — but these 5 have no direct imports either:

| Hook | Direct Imports | Via Barrel | Verdict |
|---|---|---|---|
| `use-analytics.ts` | 0 | 0 (barrel unused) | ☠️ Dead — PostHog integration is wired but never called |
| `use-saved-views.ts` | 0 | 0 | ☠️ Dead — future feature, no consumers |
| `use-tab-sync.ts` | 0 | 0 | ☠️ Dead — BroadcastChannel sync, no consumers |
| `use-filter-params.ts` | 0 | 0 | ☠️ Dead — nuqs filter hook, no consumers |
| `use-draft-autosave.ts` | 0 | 0 | ☠️ Dead — localStorage autosave, no consumers |
| `use-tenant-context.ts` | 0 | 0 | ☠️ Dead — reads TenantProvider, no consumers |

**Action**: Delete all 6 files. Clean up `hooks/index.ts` to only export living hooks. The barrel file itself can be deleted since no one imports from `@/hooks`.

### Living Hooks (keep)
- `use-debounce.ts` — 1 importer (test + feature)
- `use-media-query.ts` — 1 importer (sidebar.tsx via test)
- `use-mobile.ts` — imported by `sidebar.tsx`
- `use-receipt.ts` — imported by journal/payable/receivable actions
- `use-form-submit.ts` — imported by multiple form components

---

## 3. Dead / Self-Referencing Lib Modules

| Module | Importers | Verdict |
|---|---|---|
| `lib/status-colors.ts` | **Self-import only** (line 8 references itself in jsdoc) — 0 real consumers | ☠️ Dead |
| `lib/motion.ts` | 1 importer: `animated-containers.tsx` (which is itself dead) | ☠️ Dead (cascades from §1b) |
| `lib/idempotency.ts` | 1 importer: `use-form-submit.ts` | ✅ Keep (used transitively) |

**Action**: Delete `lib/status-colors.ts` and `lib/motion.ts`

---

## 4. Phantom Dependencies (in package.json, zero source imports)

| Package | Why It's Here | Source Imports | Action |
|---|---|---|---|
| `@radix-ui/react-radio-group` | shadcn radio-group | 0 (only dead `radio-group.tsx`) | Remove with component |
| `qrcode.react` | 2FA QR code (stubbed) | 0 | Remove — 2FA is a Neon Auth placeholder |
| `posthog-js` | Analytics | Only in dead `use-analytics.ts` | Remove — reintroduce when analytics is wired |
| `@radix-ui/react-icons` | Listed in `optimizePackageImports` | 0 source imports | Remove from package.json AND `optimizePackageImports` |

---

## 5. Redundancy & Legacy Patterns

### 5a. Dual Switchers: `company-switcher.tsx` vs `tenant-switcher.tsx`
- Both are imported **only** by `app-shell.tsx`
- `company-switcher` renders a dropdown for multi-entity navigation
- `tenant-switcher` renders org switching via Neon Auth
- They serve different purposes but the naming is confusing
- **Recommendation**: Rename `company-switcher` → `entity-switcher` to disambiguate, or consolidate into a single component

### 5b. DataTable Legacy Column API
- `data-table.tsx` (748 lines) maintains a full legacy `Column<T>` interface alongside the modern `ColumnDef<T>`
- `toColumnDefs()` and `normalizeColumns()` bridge functions add ~50 lines of dead weight
- `LegacyPaginationProps` type adds another compatibility layer
- **Recommendation**: Audit all DataTable consumers — if all use `ColumnDef`, remove the legacy `Column<T>` API, `toColumnDefs()`, `normalizeColumns()`, and `LegacyPaginationProps`

### 5c. `hooks/index.ts` Barrel File
- Exports 11 hooks, but **0 files** import from `@/hooks` (all use direct paths like `@/hooks/use-debounce`)
- **Action**: Delete the barrel file entirely. Direct imports are the established pattern.

---

## 6. Performance Config Audit

### ✅ Well-Configured
- **Compiler**: `removeConsole` in production ✅
- **Image optimization**: AVIF + WebP, 8 device/image sizes, security headers ✅
- **Experimental**: `optimizePackageImports`, `webpackBuildWorker`, `parallelServerCompiles` ✅
- **Font**: Inter with swap, preload, fallback metrics ✅
- **Caching**: Static assets 1yr immutable ✅
- **Security headers**: Full CSP, HSTS, X-Frame-Options, Permissions-Policy ✅
- **Sentry**: Error tracking + bundle analyzer ✅
- **Turbopack**: `next dev --turbopack` ✅

### 🟡 Improvements

| Issue | Detail | Fix |
|---|---|---|
| `@radix-ui/react-icons` in `optimizePackageImports` | Package not installed/imported | Remove from the array |
| `minimumCacheTTL: 60` | Very short for production images | Consider `3600` (1hr) or higher |
| No `staleTimes` experimental config | Route segment data refetched on every navigation | Consider `experimental.staleTimes` for static/dynamic cache control |
| `output: 'standalone'` gated behind env var | Good for Docker, but not set by default | Ensure `STANDALONE=true` is set in Docker builds |

---

## 7. Stability Audit

### ✅ Complete Coverage
- **Root**: `error.tsx` + `global-error.tsx` + `not-found.tsx` + `loading.tsx` ✅
- **Auth group**: `(auth)/loading.tsx` ✅
- **Shell group**: `(shell)/loading.tsx` ✅
- **Finance routes**: 25 `loading.tsx` files covering all routes ✅
- **Error boundary component**: `erp/error-boundary.tsx` (used by `app/error.tsx`) ✅

### 🟡 Missing `error.tsx` Boundaries
- No route-level `error.tsx` in `(auth)/` or `(shell)/` groups
- Falls back to root `error.tsx` — acceptable but coarser error recovery
- **Recommendation**: Add `(shell)/error.tsx` for shell-specific error recovery without full page reset

---

## 8. Cleanup Action Plan (Priority Order)

### P0 — Delete Dead Code (no consumers, zero risk)
```
DELETE  src/components/motion/                     # animated-containers.tsx + index.ts
DELETE  src/components/erp/document-viewer.tsx
DELETE  src/components/ui/radio-group.tsx
DELETE  src/lib/status-colors.ts
DELETE  src/lib/motion.ts
DELETE  src/hooks/use-analytics.ts
DELETE  src/hooks/use-saved-views.ts
DELETE  src/hooks/use-tab-sync.ts
DELETE  src/hooks/use-filter-params.ts
DELETE  src/hooks/use-draft-autosave.ts
DELETE  src/hooks/use-tenant-context.ts
DELETE  src/hooks/index.ts                         # barrel with 0 importers
```
**Files to delete: 13**  
**Lines removed: ~1,200 estimated**

### P1 — Remove Phantom Dependencies
```
REMOVE from package.json:
  - @radix-ui/react-radio-group
  - @radix-ui/react-icons  (if not transitively needed)
  - qrcode.react
  - posthog-js
```

### P1 — Config Fixes
```
EDIT next.config.ts:
  - Remove '@radix-ui/react-icons' from optimizePackageImports
  - Consider bumping minimumCacheTTL from 60 → 3600
```

### P2 — Legacy Cleanup (requires consumer audit)
- Audit all `DataTable` consumers for legacy `Column<T>` usage → remove legacy API if unused
- Rename `company-switcher.tsx` → `entity-switcher.tsx` for clarity

### P3 — Stability Hardening
- Add `(shell)/error.tsx` for shell-scoped error recovery
- Consider `(auth)/error.tsx` for auth-scoped error recovery

---

## File Inventory Summary

| Category | Count |
|---|---|
| Route pages (`page.tsx`) | 49 |
| Loading states (`loading.tsx`) | 25+ |
| Error boundaries | 3 (root, global, component) |
| UI components (`components/ui/`) | 30 |
| ERP components (`components/erp/`) | 24 |
| Feature modules (`features/finance/`) | 44+ files across 16 domains |
| Hooks | 12 (6 dead) |
| Lib modules | 16 (2 dead) |
| Providers | 2 |
| Tests | 20 files |
| **Total orphan files** | **13** |
