# Why `turbo run dev` / page load is slow

## Summary

Slow startup (~3 min to “all compiled”) comes from: (1) **root `pnpm dev` building API + worker before any dev server**, (2) **heavy proxy bundle** (auth + Sentry + OpenTelemetry) on first request, (3) **many dev tasks** started by Turbo. **Fixed:** web now uses Turbopack (`next dev`); Turbo `dev` task is `persistent: true`.

---

## Current config that still slows `pnpm dev` (~3 min)

| Cause | Evidence (current config) | Impact |
|-------|---------------------------|--------|
| **Build before dev** | Root `package.json`: `"dev": "turbo run build --filter=@afenda/api... --filter=@afenda/worker... && turbo run dev"` | Full build of API + Worker + all their workspace deps (db, core, contracts, authz, storage, platform, finance, api-kit) runs **before** any dev server starts. Often 1–2+ min. |
| **Many dev tasks** | `turbo.json`: `"dev": { "dependsOn": ["^dev"], "cache": false, "persistent": true }`. 11+ packages have a `dev` script (web, api, worker, db, contracts, core, storage, api-kit, authz, finance, platform). | Turbo starts all of them; web’s first compile (proxy + page) is the most visible. |
| **Heavy proxy** | `apps/web/src/proxy.ts` imports `@/lib/auth` (Neon Auth), and instrumentation loads Sentry edge + OpenTelemetry into the proxy bundle. | First “Compiling proxy…” and first page compile are one large bundle; Turbopack makes this faster than Webpack but it’s still non-trivial. |

---

## 1. Web app: Turbopack (fixed)

**Location:** `apps/web/package.json` → `"dev": "next dev"`

**Status:** ✅ Fixed. Web no longer uses `next dev --webpack`; Turbopack is used by default. “Compiling proxy” and page compiles are faster than with Webpack.

To use Webpack (e.g. for bundle analysis): run `next dev --webpack` in `apps/web` or use the `analyze` script.

---

## 2. Root `pnpm dev` runs a full build first

**Location:** Root `package.json` → `"dev": "turbo run build --filter=@afenda/api... --filter=@afenda/worker... && turbo run dev"`

Before any dev server starts, Turbo runs a **full build** of `@afenda/api` and `@afenda/worker` (and all their dependencies). That alone can take 1–2+ minutes and is the main reason `pnpm dev` still reaches “all compiled” in ~3 min.

**Fix (optional):**

- For **web-only** work: run `pnpm dev:web` (or `pnpm --filter @afenda/web dev`) to skip the API/worker build and only start the Next app.
- If you need API + worker: keep the current script, or split into e.g. `dev:all` (build + dev) and `dev:web` (web only).

---

## 3. “Compiling proxy” is a large bundle

**Location:** `apps/web/src/proxy.ts` (Next.js 16 proxy, replaces middleware)

The proxy runs on every matching request and is compiled as a single bundle. It pulls in:

- `@/lib/auth` → `@neondatabase/auth` (Neon Auth middleware)
- Next.js instrumentation → **Sentry** (`sentry.edge.config.ts`) and **OpenTelemetry** (Sentry’s dependency)
- `@/lib/constants` (routes)

So “Compiling proxy” is one big compilation (auth + Sentry + OpenTelemetry + Next). With Turbopack it’s faster than with Webpack; it still contributes to first-load time.

**Possible mitigations (advanced):**

- Ensure proxy only imports the minimal auth surface (e.g. only `auth.middleware`) and avoid pulling server-only code into the Edge bundle.
- Consider disabling or lazy-loading Sentry in development for the Edge runtime if you don’t need it there during dev.

---

## 4. Turbo `dev` task

**Location:** `turbo.json` → `"dev": { "dependsOn": ["^dev"], "cache": false, "persistent": true }`

**Status:** ✅ `persistent: true` so Turbo correctly treats dev as a long-running task.

`turbo run dev` runs `dev` in **every package that has a `dev` script** and satisfies the dependency graph (e.g. api, worker, web, db, contracts, core, authz, etc.). The main delay is still (1) the initial build phase and (2) web’s first compile (improved with Turbopack). For frontend-only work, prefer `pnpm dev:web`.

---

## Quick reference

| Goal | Command |
|------|--------|
| Start only the web app (fast, no API/worker build) | `pnpm dev:web` or `pnpm --filter @afenda/web dev` |
| Start full stack (build API + worker, then all dev tasks) | `pnpm dev` |
| Webpack for web (e.g. bundle analysis) | In `apps/web`: `next dev --webpack` or `pnpm analyze` |

**Validated:** As of this doc, `apps/web` uses `next dev` (Turbopack) and `turbo.json` has `dev.persistent: true`. The ~3 min to “all compiled” is dominated by the root `dev` script’s **build phase** (API + worker + deps) before any dev server starts; use `pnpm dev:web` to avoid that when working on the frontend only.

---

## Next.js MCP diagnosis (evidence)

Run diagnostics via Next.js MCP (`nextjs_index` → `nextjs_call` with `get_errors`, `get_logs`, `get_project_metadata`) when the dev server is running.

**Example from dev log** (`.next/dev/logs/next-development.log`):

- Server ready in **~16s** after start.
- First request triggers **Compiling proxy** (~54s after ready), then **Compiling /** — first page TTFB **141s (poor)**.
- Next route (**/finance**) TTFB **~29s (poor)**; Fast Refresh then does a full reload.
- **Hydration error** (one session): `aria-label` mismatch on a command-palette button (`"Search"` vs `"Open command palette"` / `"Search or run command..."`). Fix by ensuring server and client render the same label (e.g. single source for placeholder/label).

This confirms: (1) proxy + first page compile dominate first-load time; (2) Turbopack is running (no Webpack); (3) one hydration issue to fix for stability.

---

## Best-practice solutions (Next.js + Turbo)

### 1. Use web-only dev when possible (biggest win)

```bash
pnpm dev:web
```

Skips the root build phase (API + worker). Use `pnpm dev` only when you need the full stack.

### 2. Turbopack dev cache (already applied)

In `next.config.ts`:

```ts
experimental: {
  turbopackFileSystemCacheForDev: true,  // persist cache between restarts
  turbopackFileSystemCacheForBuild: true,
  // ...
}
```

Second and later `pnpm dev:web` runs reuse cached proxy/page output; first run still compiles normally.

### 3. Official Next.js local dev checklist

From [Next.js: Optimizing local development](https://nextjs.org/docs/app/building-your-application/optimizing/local-development):

| Check | Action |
|-------|--------|
| **Turbopack** | ✅ Use `next dev` (no `--webpack`). |
| **Antivirus** | Exclude project folder (e.g. Windows Defender) to avoid slow file access. |
| **Imports** | Prefer direct imports; avoid barrel files and huge icon sets in the proxy path. |
| **Tailwind content** | Don’t scan `node_modules` or overly broad paths. |
| **Package imports** | ✅ `optimizePackageImports` already set for cmdk, lucide-react, etc. |
| **Custom webpack** | Avoid for dev; use Turbopack. Keep webpack only for `analyze` if needed. |
| **Docker** | Prefer local `pnpm dev`; Docker on Mac/Windows can make HMR very slow. |

### 4. Profile with Turbopack tracing

To see where time is spent during dev:

```bash
cd apps/web && NEXT_TURBOPACK_TRACING=1 pnpm dev
```

Then open the app, reproduce the slow path, stop the server, and run:

```bash
npx next internal trace .next/dev/trace-turbopack
```

View at https://trace.nextjs.org/ (switch to “Spans in order” for per-module timings).

### 5. Fix hydration and reloads

- Resolve the command-palette `aria-label` / placeholder mismatch so server and client render the same text (see log snippet above).
- Reducing hydration errors avoids full reloads and improves perceived dev speed after the first load.
