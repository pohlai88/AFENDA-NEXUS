# Next.js MCP Scan Report — Afenda Web

**Date:** 2026-03-01  
**Scope:** `apps/web` (monorepo: NEXUSCANON-AFENDA)  
**Reference:** [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp), [MCP-AUDIT.md](./MCP-AUDIT.md)

---

## Latest Scan (2026-03-01)

| Tool | Result |
|------|--------|
| **nextjs_index** | ✅ 1 server on port 3000 |
| **get_errors** | ✅ No errors in 1 browser session |
| **get_routes** | ✅ 150+ App Router routes |
| **Build** | ✅ Compiled successfully |

**Stabilization applied:** Added `Zap` to `icon-map.ts`; switched `afenda-command-palette` and `reconciliation-workspace` to `getIcon('Zap')` to reduce HMR "module factory not available" errors.

---

## 1. MCP Initialization Status

| Item | Status |
|------|--------|
| **next-devtools MCP** | ✅ Loaded (project-0-NEXUSCANON-AFENDA-next-devtools) |
| **Available MCP servers** | `user-Neon`, `cursor-ide-browser` only |
| **Configuration** | `next-devtools` is configured in `.cursor/.mcp.json` |
| **Dev server** | Running (`pnpm dev` — API on 3001, web on 3000, worker on 3002) |

### Enabling next-devtools MCP

The `init`, `nextjs_index`, and `nextjs_call` tools require the next-devtools MCP server to be loaded:

1. **Restart Cursor** so `.cursor/.mcp.json` is applied.
2. **Or** add `next-devtools` to the workspace MCP config (`.cursor/mcp.json`) if it overrides.
3. **Ensure the dev server is running** before using runtime tools (`get_errors`, `get_logs`, etc.).

### Direct MCP endpoint (Next.js 16+)

The Next.js dev server exposes `http://localhost:3000/_next/mcp` for JSON-RPC. Use `nextjs_index` and `nextjs_call` via the MCP client when next-devtools is loaded.

---

## 2. Errors & Risks Identified

### 2.1 Build / Compilation

| File | Status | Notes |
|------|--------|-------|
| `apps/web/src/components/erp/error-boundary.tsx` | ✅ Fixed | Missing `>` on `<a href={routes.home}>` — resolved in prior session |
| **Production build** | ✅ Passes | `pnpm --filter @afenda/web build` succeeds |
| **Linter** | ✅ Clean | No linter errors in `apps/web/src` |

### 2.2 Dashboard API — Missing Endpoints (High Risk)

The web app calls these dashboard endpoints, but **only `/dashboard/summary` exists** in the API:

| Endpoint | Status | Used by |
|----------|--------|---------|
| `/dashboard/summary` | ✅ Implemented | `getDashboardSummary()` |
| `/dashboard/kpis` | ❌ 404 | `getDashboardKPIs()` |
| `/dashboard/cash-flow-chart` | ❌ 404 | `getCashFlowChart()` |
| `/dashboard/revenue-expense-chart` | ❌ 404 | `getRevenueExpenseChart()` |
| `/dashboard/ar-aging-chart` | ❌ 404 | `getARAgingChart()` |
| `/dashboard/recent-activity` | ❌ 404 | `getRecentActivity()` |
| `/dashboard/attention-items` | ❌ 404 | `getAttentionItems()` |
| `/dashboard/quick-actions` | ❌ 404 | `getQuickActions()` |

**Location:** `packages/modules/finance/src/slices/hub/routes/dashboard-routes.ts` — only `/dashboard/summary` is registered.

**Impact:** Finance dashboard charts, KPIs, attention items, and quick actions will fail or show empty states.

### 2.3 Auth / Tenant Context (Medium Risk)

| Endpoint | Status | Notes |
|----------|--------|------|
| `/ledgers`, `/periods`, `/settings/org` | 401 | Unauthorized — tenant or auth context may be missing |
| `/api/auth/list-organizations` | 404 | Neon Auth API — path may differ from Neon Auth docs |

**Location:** `apps/web/src/lib/tenant-context.server.ts` calls `list-organizations` for org name resolution. Falls back to truncated ID on failure (non-blocking).

### 2.4 Worker / Infrastructure (Medium Risk)

| Component | Error |
|-----------|-------|
| **Worker** | `drain-outbox` failing: DB connection or `erp.outbox` schema issue |
| **Redis** | `getaddrinfo ENOTFOUND` — cache invalidation disabled |

---

## 3. Warnings

| Source | Message |
|--------|---------|
| **Build** | `Route /onboarding couldn't be rendered statically because it used cookies` |
| **Build** | `[auth.getSession] Cookie validation error` — Dynamic server usage during build |

**Note:** `/onboarding` is correctly marked as dynamic (ƒ). The warning is from auth during static generation; the route itself is dynamic.

---

## 4. Stabilization Recommendations

### Priority 1 — Dashboard Endpoints

Implement the missing dashboard routes in `packages/modules/finance/src/slices/hub/routes/dashboard-routes.ts`:

- `GET /dashboard/kpis` — KPI cards
- `GET /dashboard/cash-flow-chart` — Cash flow data points
- `GET /dashboard/revenue-expense-chart` — Revenue/expense data points
- `GET /dashboard/ar-aging-chart` — AR aging buckets
- `GET /dashboard/recent-activity` — Activity items (or reuse from summary)
- `GET /dashboard/attention-items` — Attention/approval items
- `GET /dashboard/quick-actions` — Quick action config

Alternatively, consolidate into `/dashboard/summary` and have the frontend derive charts/KPIs from that payload until individual endpoints are ready.

### Priority 2 — Auth / Tenant

- Verify `X-Tenant-Id` and Bearer token are passed correctly when calling `/ledgers`, `/periods`, `/settings/org`.
- Check Neon Auth docs for the correct `list-organizations` path if 404 persists.

### Priority 3 — Worker & Redis

- Fix DB connection for the worker (connection string, pool, or `erp.outbox` schema).
- Configure Redis for local dev or use a local Redis instance if cache invalidation is required.

### Priority 4 — MCP / DevEx

- Enable next-devtools MCP (restart Cursor or add to workspace config).
- After init, use `nextjs_index` and `nextjs_call` with `get_errors`, `get_logs`, `get_page_metadata` for ongoing diagnostics.

---

## 5. Build Summary

- **Next.js:** 16.1.6 (Turbopack)
- **Production build:** Successful
- **Route tree:** 200+ routes
- **Static routes:** `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `accept-invite`, `dashboard`, `_not-found`, `robots.txt`, `sitemap.xml`
- **Dynamic:** Most shell routes (`/finance`, `/admin`, `/portal`, etc.)

---

## 6. References

- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)
- [next-devtools-mcp](https://github.com/vercel/next-devtools-mcp)
- [MCP-AUDIT.md](./MCP-AUDIT.md)
- Internal: `.agents/skills/next-best-practices/`
