# CI Gates Violation Report

**Date**: 2026-03-01  
**Total Gates**: 37  
**Passed**: 25 ✅  
**Failed**: 12 ❌  
**Duration**: 203.89s

---

## Executive Summary

12 of 37 gates failed, revealing **313 violations** across 6 categories:
1. **KPI Stubs** - 52 hardcoded resolvers
2. **Contract Drift** - 174 local types missing schemas
3. **E2E Coverage** - 23 routes without tests
4. **Agent Drift** - 8 unregistered skills  
5. **React Keys** - 33 array-index keys
6. **Architecture** - 76 web module violations

---

## Failed Gates Detail

### 1. ❌ KPI Stub Tracker (52 violations)

**Impact**: Production KPIs returning hardcoded data

**Examples**:
- `fin.overview.totalRevenue` - Returns `{value: 1234567, change: 12.3}`
- `fin.overview.netProfit` - Returns mock data
- `fin.rp.incomeStmt` - Returns hardcoded array
- `home.activity` - Mock activity feed

**Fix**: Wire to real API or add exemption comment
```typescript
// @kpi-stub-exempt: Waiting for finance API v2 migration
export const totalRevenue = async () => ({value: 0, change: 0});
```

**Priority**: 🔴 **HIGH** - Affects dashboard accuracy

---

### 2. ❌ Contract Response Drift (174 violations)

**Impact**: 42 query files using local types instead of `@afenda/contracts`

**Top offenders**:
- `portal.queries.ts` - 7 local types (PortalWhtCertificate, PortalComplianceItem, etc.)
- Feature queries across finance module
- Missing Zod schemas for validation

**Fix**: Export schemas from `@afenda/contracts`
```typescript
// In @afenda/contracts
export const PortalWhtCertificateSchema = z.object({
  id: z.string(),
  year: z.number(),
  // ...
});
```

**Priority**: 🟡 **MEDIUM** - Affects type safety & validation

---

### 3. ❌ E2E Coverage (23 uncovered routes)

**Missing tests** for:
- `/boardroom` - Boardroom dashboard
- `/admin` - Admin configuration
- `/settings` - User settings
- `/portal/*` - All 11 portal routes
- `/crm`, `/hrm` - CRM/HRM modules
- Auth flows: `/accept-invite`, `/reset-password`, `/verify-email`

**Current coverage**: 3/26 routes (11.5%)

**Fix**: Add Playwright specs in `apps/e2e/tests/`

**Priority**: 🟡 **MEDIUM** - Affects regression detection

---

### 4. ❌ Agent Drift (8 unregistered skills)

**Unregistered skills**:
1. `shadcn-ui`
2. `shadcn-ui-stitch`
3. `soul-guardian`
4. `typescript-advanced-types`
5. `zod`
6. `nextjs-app-router-patterns`
7. `tailwind-v4-shadcn`
8. `react-testing-patterns`

**Fix**: Register in `.agents/skills-registry.json`

**Priority**: 🟢 **LOW** - Affects skill discoverability

---

### 5. ❌ React Keys (33 violations)

**Issue**: Array indices used as React keys

**Files with violations**:
- Loading skeletons: `finance/*/loading.tsx` (3)
- IFRS pages: `ifrs-standards/*/page.tsx` (6)
- Components: `charts.tsx`, `dashboard-page.tsx`, `drilldown.tsx` (5)
- Feature blocks: `*-sections.tsx` files (8)
- Forms: `portal-invoice-submit-form.tsx`, `billing-wizard.tsx` (2)

**Fix**: Replace `key={i}` with `key={item.id}` or stable ID

**Priority**: 🟡 **MEDIUM** - Already fixed for new code via ESLint

---

### 6. ❌ Architecture Guard (46 violations)

**Web drift violations (W01-W27)**:

#### W02: Missing metadata (31 pages)
All `/finance/docs/*` pages missing SEO metadata

**Fix**: Add to each `page.tsx`
```typescript
export const metadata: Metadata = {
  title: 'Page Title | Finance',
  description: '...'
};
```

#### W27: EmptyState registry (7 violations)
Components using hardcoded `title=` without `contentKey=`

**Files**:
- `module-nav-popover.tsx:148`
- `shortcut-popover.tsx:218`
- `notification-center.tsx:251`
- `activity-feed.tsx:126`
- `attention-panel.tsx:122`
- `quick-actions.tsx:79`
- `ap-duplicate-review-table.tsx:92`

**Fix**: Use registry key
```typescript
// Before
<EmptyState title="No items found" />

// After
<EmptyState contentKey="finance.payables.noItems" />
```

#### Missing loading.tsx (10 routes)
`/finance/docs/*` routes missing sibling `loading.tsx`

**Priority**: 🟡 **MEDIUM** - Affects UX & SEO

---

### 7. ❌ Web Module (56 violations)

**Summary**:
- 46 web-drift violations (see above)
- 10 missing `loading.tsx` files
- 2 advisory: No `@afenda/contracts` usage in `expenses` & `instruments` modules

**Priority**: 🟡 **MEDIUM** - Module structure issues

---

### 8. ❌ Dependency Audit (4 vulnerabilities)

**HIGH severity** (1):
- `serialize-javascript` <=7.0.2 - RCE vulnerability
- Path: `@sentry/nextjs` → `webpack` → `terser-webpack-plugin`
- Fix: Update `@sentry/nextjs` or override

**MODERATE** (2) + **LOW** (1):  
- Not shown in truncated output

**Priority**: 🔴 **HIGH** - Security vulnerability

---

### 9. ❌ OpenAPI Drift

**Issue**: Committed spec has 235 paths, generated has 250 paths (+15 new)

**Fix**: 
```bash
node tools/scripts/gen-openapi.mjs
git add docs/openapi.json
git commit -m "Update OpenAPI spec with 15 new endpoints"
```

**Priority**: 🟢 **LOW** - Documentation drift

---

### 10. ❌ Neon Integration Sync

**Issue**: Schema has pending changes not captured in migrations

**Fix**:
```bash
pnpm --filter @afenda/db db:generate
git add packages/db/drizzle/*
git commit -m "Add migration for schema changes"
```

**Priority**: 🔴 **HIGH** - Database schema drift

---

## Passed Gates ✅ (25)

- ✅ Icon integrity
- ✅ DB module gate
- ✅ Worker module gate  
- ✅ Contract completeness
- ✅ Monorepo drift check
- ✅ API smoke CI
- ✅ Schema conventions
- ✅ Turbo.json configuration
- ✅ AIS benchmark audit
- ✅ Schema↔entity alignment
- ✅ Kernel invariants
- ✅ SOX ITGC audit
- ✅ Status types gate
- ✅ Loading skeleton
- ✅ API module gate
- ✅ Identity SoT gate
- ✅ React cache() enforcement
- ✅ Currency safety gate
- ✅ Response type SoT
- ✅ Dependency graph
- ✅ Test directory convention
- ✅ Money safety gate
- ✅ Hydration safety
- ✅ React best practices
- ✅ Unused exports gate

---

## Priority Action Plan

### 🔴 Critical (Fix Immediately)

1. **Dependency Audit** - Update `@sentry/nextjs` to fix RCE vulnerability
2. **Neon Integration** - Generate pending database migration
3. **KPI Stubs** - Wire top 10 KPIs to real APIs or document exemptions

### 🟡 High (Fix This Sprint)

4. **Contract Drift** - Add Zod schemas for portal types (7 schemas)
5. **React Keys** - Fix 33 array-index violations
6. **Metadata** - Add SEO metadata to 31 finance docs pages
7. **EmptyState** - Add registry keys to 7 components

### 🟢 Medium (Technical Debt)

8. **E2E Coverage** - Add tests for 5 critical routes (auth, admin, portal dashboard)
9. **Loading States** - Add 10 missing `loading.tsx` files
10. **OpenAPI** - Regenerate and commit spec
11. **Agent Registry** - Register 8 skills

---

## Gate Performance

**Fastest gates** (<1s):
- Icon integrity: 464ms
- DB module: 495ms
- Worker module: 506ms

**Slowest gates** (>10s):
- Unused exports: 203.54s (needs optimization)
- Neon integration: 29.74s
- OpenAPI drift: 18.33s
- Dependency audit: 12.28s
- Web module: 10.17s

**Total runtime**: 203.89s (3min 24s) with concurrency=8

---

## Recommendations

1. **Immediate**: Fix 3 critical security/data issues
2. **This week**: Address 7 high-priority violations (105 total fixes)
3. **This sprint**: Improve E2E coverage to 50% (13/26 routes)
4. **Ongoing**: Set up pre-commit hooks to prevent new violations

**Next CI run**: Expected 29-31 passing gates after critical fixes
