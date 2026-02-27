# Agent Guidance — Afenda

Guidance for AI coding agents working in the NEXUSCANON-AFENDA monorepo.

## Next.js App (`apps/web`)

### MCP Workflow (Next.js 16+)

1. **Start the dev server** before using Next.js MCP tools:
   ```bash
   pnpm dev
   # or: pnpm --filter @afenda/web dev
   ```

2. **Call `init` first** — At session start, invoke the `init` tool from next-devtools-mcp:
   - Establishes docs-first approach for Next.js queries
   - Documents available MCP tools
   - Optional: pass `project_path: "apps/web"` for monorepo context

3. **Use Next.js MCP tools for diagnostics:**
   - `nextjs_index` — Discover running Next.js servers and available tools
   - `nextjs_call` — Execute tools like `get_errors`, `get_logs`, `get_page_metadata`, `get_project_metadata`
   - `nextjs_docs` — Query Next.js documentation
   - `browser_eval` — Run code in browser context

4. **Before modifying the app:** Use `nextjs_index` to inspect current routes, components, and errors.

### Key Conventions

- **Proxy:** `src/proxy.ts` (Next.js 16) — replaces middleware; uses `config.matcher`
- **Params/searchParams:** Always async (`await params`, `await searchParams`) in Server Components
- **Client + useSearchParams:** Wrap in `<Suspense>` to avoid full-page CSR bailout
- **Error handling:** Root `error.tsx`, `global-error.tsx`, `not-found.tsx`; segment-level where needed

### References

- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)
- [apps/web/MCP-AUDIT.md](apps/web/MCP-AUDIT.md) — Full MCP audit report
- `.agents/skills/next-best-practices/` — Internal Next.js guidelines
