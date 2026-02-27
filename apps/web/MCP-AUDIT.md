# Next.js MCP Audit — Afenda Web

**Audit date:** 2025-02-27  
**Scope:** `apps/web` — runtime, routes, E2E, MCP integration  
**Reference:** [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)

---

## Executive Summary

The Afenda web app aligns with Next.js 16 MCP best practices. Runtime, proxy, routes, and E2E setup are production-ready. Recommended refinements focus on documentation updates and MCP workflow consistency.

| Area | Status | Notes |
|------|--------|-------|
| Runtime | ✅ Compliant | Node.js default, no ad-hoc Edge usage |
| Proxy (v16) | ✅ Compliant | `proxy.ts`, `config.matcher` |
| Routes & Params | ✅ Compliant | Async `params` / `searchParams` |
| Error Handling | ✅ Strong | Root + segment error/not-found |
| E2E | ✅ Compliant | Playwright, standalone build |
| MCP Setup | ✅ Configured | `next-devtools-mcp` in `.mcp.json` |

---

## 1. Runtime

**Finding:** No explicit `runtime = 'edge'`. Default Node.js runtime is used.

**Best practice:** Use Node.js by default; prefer Edge only when latency or distribution justify it. See `runtime-selection.md`.

**Recommendation:** Keep current setup. Add Edge only if specific routes require it (e.g., geo-routing).

---

## 2. Proxy (Next.js 16)

**Location:** `src/proxy.ts`

**Finding:** Correct Next.js 16 proxy configuration:

- Exported function: `proxy(request: NextRequest)`
- Config export: `config` with `matcher`
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and files with extensions
- Delegates auth to Neon Auth middleware for protected routes
- Public paths (login, register, etc.) bypassed; API routes pass through

**Reference:** [Next.js proxy file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

**Recommendation:** None. Implementation is correct.

---

## 3. Routes & Params

**Route handler:** `src/app/api/auth/[...path]/route.ts` — delegates to Neon Auth `handler()`.

**Page params/searchParams:** Pages use the Next.js 15+ async pattern:

```ts
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; ... }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page } = await searchParams ?? {};
  // ...
}
```

**Client components:** Use `useSearchParams()` with `<Suspense>` boundaries to avoid full-page CSR bailout.

**Recommendation:** None. Implementation is correct.

---

## 4. Error Handling

**Coverage:**

- Root: `error.tsx`, `global-error.tsx`, `not-found.tsx`
- Segments: `(auth)`, `(shell)`, `(supplier-portal)` each have segment-level `error.tsx` and `not-found.tsx`
- Sentry integration in error boundaries

**Recommendation:** None. Current structure matches Next.js best practices.

---

## 5. End-to-End Testing

**Setup:** `apps/e2e` with Playwright

**Configuration:**

- `baseURL: http://localhost:3000`
- Web server: `pnpm start:standalone` (built Next.js standalone)
- API server: `node dist/index.js` (port 3001)
- Auth: `globalSetup` seeds session; `storageState` reused
- Projects: chromium, firefox, mobile-chrome
- Artifacts: trace/screenshot/video on failure

**MCP integration:** Next.js MCP docs mention Playwright MCP. The workspace includes `cursor-ide-browser` for in-IDE browser testing.

**Recommendation:** Consider Playwright MCP alongside `next-devtools-mcp` for browser-driven flows (optional).

---

## 6. MCP Configuration

**`.cursor/.mcp.json`:**

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Tools available (via `init`):**

- `init` — Call first to establish Next.js context and docs-first behavior
- `nextjs_index` — Discover running Next.js servers and tools
- `nextjs_call` — Call Next.js MCP tools (get_errors, get_logs, get_page_metadata, etc.)
- `nextjs_docs` — Query Next.js docs
- `browser_eval` — Run code in browser context
- `upgrade_nextjs_16` — Upgrade guidance
- `enable_cache_components` — Cache Components setup

**Cursor rules:** `.cursorrules` instructs agents to start the dev server and call `init` at session start.

**Recommendation:** Keep current setup. Optionally pass `project_path` to `init`:

```json
// When calling init tool
{ "project_path": "apps/web" }
```

---

## 7. Documentation Fixes Applied

1. **PERFORMANCE.md:** Replace "middleware" with "proxy" terminology.
2. **file-conventions.md (agents skill):** Correct `proxyConfig` → `config` per official docs.
3. **AGENTS.md:** Add MCP workflow guidance (if missing).

---

## 8. Enterprise Checklist

| Item | Status |
|------|--------|
| Proxy/auth at network edge | ✅ Neon Auth via proxy |
| Security headers (CSP, HSTS, etc.) | ✅ `next.config.ts` headers |
| Error monitoring | ✅ Sentry |
| Structured logging | Via Pino (if configured) |
| E2E against built app | ✅ Standalone build |
| Async params/searchParams | ✅ All pages |
| MCP for AI-assisted debugging | ✅ next-devtools-mcp |

---

## References

- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)
- [Proxy file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [next-devtools-mcp](https://github.com/vercel/next-devtools-mcp)
- Internal: `.agents/skills/next-best-practices/`
