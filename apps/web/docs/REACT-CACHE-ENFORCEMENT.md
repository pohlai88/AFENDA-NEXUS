# React Cache Enforcement — RBP-CACHE

## Overview

All server-side data fetchers performing API calls or database queries **must** use React's `cache()` function for automatic request memoization. This prevents redundant calls when multiple components request the same data within a single React render pass.

**Status**: ✅ Enforced via ESLint + CI Gate (since 2026-03)

## Why React cache() is Required

### Problem: Duplicate API Calls

Without `cache()`, multiple components requesting the same data in a server render tree will trigger duplicate API calls:

```typescript
// ❌ BAD: Each call to resolveKPIs triggers new API requests
export async function resolveKPIs(ids: string[], ctx: RequestContext) {
  const results = await Promise.allSettled(
    ids.map((id) => api.get(`/kpis/${id}`))
  );
  // ...
}

// Component A requests KPIs → 3 API calls
// Component B requests same KPIs → 3 MORE API calls (duplicate!)
```

### Solution: Request Memoization

With `cache()`, React automatically deduplicates requests within a single render pass:

```typescript
// ✅ GOOD: Wrapped with cache() for automatic deduplication
import { cache } from 'react';

export const resolveKPIs = cache(
  async (ids: string[], ctx: RequestContext) => {
    const results = await Promise.allSettled(
      ids.map((id) => api.get(`/kpis/${id}`))
    );
    // ...
  }
);

// Component A requests KPIs → 3 API calls
// Component B requests same KPIs → 0 API calls (cached!)
```

### Performance Benefits

From real-world Module Map optimization (see [`MODULE-MAP-OPTIMIZATION-REPORT.md`](./MODULE-MAP-OPTIMIZATION-REPORT.md)):

- **50-70% reduction** in redundant API calls
- **30-40% faster** page loads when multiple components fetch data
- **Reduced backend load** during traffic spikes
- **Zero breaking changes** — transparent to consumers

## Enforcement Mechanisms

### 1. ESLint Rule (Pre-commit)

**File**: `apps/web/eslint.config.js`

Detects server data fetchers lacking `cache()`:

```javascript
{
  selector: "ExportNamedDeclaration[declaration.type='FunctionDeclaration'][declaration.async=true][declaration.id.name=/^(fetch|resolve|build|get)/]",
  message: 'Server data fetcher should use React cache() for request memoization (RBP-CACHE)...'
}
```

**Triggers on**: `export async function fetchX`, `export async function resolveY`, `export async function buildZ`

**Runs**: Pre-commit via lint-staged, CI quality job

### 2. CI Gate Script (Build-time)

**File**: `tools/scripts/gate-react-cache.mjs`

Comprehensive validation checking:

1. **Pattern A**: Server-only files (`*.server.ts`) with async exports
2. **Pattern B**: Functions with `Promise.all`/`allSettled` (strong signal)
3. **Pattern C**: Data fetchers in established paths (`build-*`, `resolve-*`, `fetch-*`)

**Runs**: CI guards job (30+ parallel gates)

**Command**: `pnpm gate:react-cache`

## When to Use cache()

### ✅ Required

- **Server-only data fetchers** (`*.server.ts`) performing API calls or DB queries
- **Functions with parallel operations** (`Promise.all`, `Promise.allSettled`)
- **Data builders** (`build-*.ts`, e.g., `buildFinanceFeatureMetrics`)
- **Resolvers** (`resolve-*.ts`, e.g., `resolveKPIs`, `resolveAttentionSummary`)
- **Chart/diagram fetchers** (e.g., `fetchCashFlowChart`, `fetchArAgingDiagram`)

### ❌ Not Required

- **Client components** (`'use client'`) — cache() only works server-side
- **Server Actions** (`'use server'`) — different execution model
- **Single synchronous operations** — no benefit from memoization
- **Mutations** — POST/PUT/DELETE should not be cached

## Migration Guide

### Step 1: Identify Functions to Migrate

Look for:
- `*.server.ts` files with async exports
- Functions using `Promise.all` or `Promise.allSettled`
- Files named `build-*`, `resolve-*`, `fetch-*`

### Step 2: Convert Function to cache()

**Before**:
```typescript
export async function fetchData(ctx: RequestContext): Promise<Data> {
  const api = createApiClient(ctx);
  const [users, posts] = await Promise.all([
    api.get('/users'),
    api.get('/posts')
  ]);
  return { users, posts };
}
```

**After**:
```typescript
import { cache } from 'react';

export const fetchData = cache(
  async (ctx: RequestContext): Promise<Data> => {
    const api = createApiClient(ctx);
    const [users, posts] = await Promise.all([
      api.get('/users'),
      api.get('/posts')
    ]);
    return { users, posts };
  }
);
```

### Step 3: Update Call Sites (Usually None!)

In most cases, no changes needed — the signature is compatible:

```typescript
// ✅ Both work identically
const data1 = await fetchData(ctx); // Before (function)
const data2 = await fetchData(ctx); // After (cached function)
```

### Step 4: Verify with Linter

```bash
pnpm --filter @afenda/web lint
```

Fix any `RBP-CACHE` warnings.

### Step 5: Run CI Gate

```bash
pnpm gate:react-cache
```

Should pass with no violations.

## Escape Hatch: When NOT to cache

In rare cases, you may legitimately need to skip caching:

```typescript
// rbp-allow:no-cache — Real-time data must always be fresh
export async function fetchLiveStockPrice(symbol: string) {
  // This data must never be cached
  return api.get(`/live/${symbol}`);
}
```

**Use sparingly!** Discuss with team before using.

## Examples from Codebase

### ✅ Good: buildFinanceFeatureMetrics

**File**: `apps/web/src/lib/finance/build-feature-metrics.ts`

```typescript
import { cache } from 'react';

export const buildFinanceFeatureMetrics = cache(
  async (ctx: RequestContext): Promise<FeatureMetricMap> => {
    const api = createApiClient(ctx);
    const [apResult, arResult, glResult] = await Promise.allSettled([
      api.get('/ap/summary'),
      api.get('/ar/summary'),
      api.get('/gl/summary'),
    ]);
    // ... format and return
  }
);
```

**Benefits**:
- Dashboard fetches metrics once, not 3x
- Automatic deduplication across Module Map + KPI Deck

### ✅ Good: resolveKPIs

**File**: `apps/web/src/lib/kpis/kpi-registry.server.ts`

```typescript
import { cache } from 'react';

export const resolveKPIs = cache(
  async (ids: string[], ctx: RequestContextLike, options?) => {
    const results = await Promise.allSettled(
      ids.map((id) => KPI_RESOLVERS[id]?.(ctx))
    );
    return results.map(/* ... */);
  }
);
```

**Benefits**:
- Multiple KPI cards requesting same IDs → single batch fetch
- Suspense boundaries don't trigger duplicate requests

### ✅ Good: resolveAttentionSummary

**File**: `apps/web/src/lib/attention/attention-registry.server.ts`

```typescript
import { cache } from 'react';

export const resolveAttentionSummary = cache(
  async (ctx: RequestContextLike): Promise<AttentionSummary> => {
    const results = await Promise.allSettled(
      resolvers.map(([name, resolver]) => resolver(ctx))
    );
    // ... aggregate and return
  }
);
```

**Benefits**:
- Shell header + dashboard both need attention → single fetch
- Parallel layout rendering doesn't duplicate work

## Verification Steps

### Local Development

1. **Run linter**:
   ```bash
   pnpm --filter @afenda/web lint
   ```

2. **Run gate locally**:
   ```bash
   pnpm gate:react-cache
   ```

3. **Test in browser**:
   - Open DevTools → Network tab
   - Navigate to dashboard
   - Verify no duplicate API calls for same data

### CI Pipeline

1. **Quality job** (line 86-96 in `.github/workflows/ci.yml`):
   - Runs ESLint automatically

2. **Guards job** (line 148-161):
   - Runs `gate-react-cache` in parallel with 30+ other gates

3. **Pre-commit hook**:
   - Lint-staged runs ESLint on changed TypeScript files

## Troubleshooting

### "Cache is not working"

**Symptom**: Still seeing duplicate API calls

**Solutions**:
1. Verify function is wrapped with `cache()`, not just imported
2. Ensure function arguments are **identical** (React uses shallow equality)
3. Check that function is called within same request lifecycle

### "Type errors after migration"

**Symptom**: TypeScript errors after converting to `cache()`

**Solutions**:
1. Ensure function signature is preserved (params + return type)
2. Use explicit type annotations on `cache()` wrapper if needed:
   ```typescript
   export const fetchData: (ctx: Context) => Promise<Data> = cache(
     async (ctx) => { /* ... */ }
   );
   ```

### "Gate failing on existing code"

**Symptom**: `gate:react-cache` reports violations

**Solutions**:
1. Follow migration guide above to wrap functions
2. If legitimate exception, add escape hatch comment
3. Run `pnpm gate:react-cache` locally to iterate quickly

## References

- **Vercel React Best Practices**: `.agents/skills/vercel-react-best-practices/rules/server-cache-react.md`
- **Next.js 16 Docs**: Request memoization with React `cache()`
- **Optimization Report**: [`MODULE-MAP-OPTIMIZATION-REPORT.md`](./MODULE-MAP-OPTIMIZATION-REPORT.md)
- **ESLint Config**: `apps/web/eslint.config.js` (RBP-CACHE rule)
- **CI Gate**: `tools/scripts/gate-react-cache.mjs`

## FAQ

**Q: Does cache() work across different requests?**  
A: No. `cache()` only deduplicates within a single request/render pass. Each user request gets fresh data.

**Q: Can I use cache() in client components?**  
A: No. `cache()` only works in Server Components and server-only modules.

**Q: What if I need to bust the cache?**  
A: Not applicable — cache only lasts for the current request. Each new page load fetches fresh data.

**Q: Does this replace SWR/React Query?**  
A: No. This is for **server-side** request deduplication. SWR/React Query handle **client-side** caching.

**Q: Will this break my tests?**  
A: No. `cache()` is transparent and works identically in test environments.

---

**Last Updated**: 2026-03-01  
**Enforced Since**: 2026-03-01  
**Status**: ✅ Active — ESLint + CI Gate
