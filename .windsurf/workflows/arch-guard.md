---
description: Run per-package ARCHITECTURE.md governance checks
---

# /arch-guard — Per-Package Governance Gate

Validates every package's `ARCHITECTURE.*.md` YAML frontmatter against the actual codebase.

## Steps

1. Run the full governance check:
// turbo
```bash
node tools/drift-check/src/arch-guard.mjs
```

2. If failures exist, read the failing package's `ARCHITECTURE.*.md` to understand the rules:
```bash
# Example: cat packages/core/ARCHITECTURE.@afenda-core.md
```

3. Fix the violations — common fixes:
   - **E6/E7 (dep not in allowlist):** Add the dep to `dependency_kinds.allowed_runtime` or `allowed_dev` in the ARCHITECTURE.md frontmatter
   - **E8 (forbidden import):** Either remove the import or add a path-scoped exception in `allow_imports_by_path`
   - **E4/E5 (missing file/dir):** Create the missing file or directory, or run with `--fix` to auto-create dirs
   - **E13 (circular dep):** Remove the circular dependency between packages
   - **E14 (public API):** Ensure public_api file exists and has exports
   - **E15 (port parity):** Add a Drizzle implementation for the missing port interface

4. Re-run to verify:
// turbo
```bash
node tools/drift-check/src/arch-guard.mjs
```

5. (Optional) Run unused export scanner:
```bash
node tools/drift-check/src/unused-exports.mjs
```

6. (Optional) Run coverage enforcement:
```bash
pnpm turbo test:coverage --filter=@afenda/finance
```

## Checks

| Check | What it validates |
|-------|-------------------|
| E1-E5 | Structure: ARCHITECTURE.md exists, fields match, required files/dirs |
| E6-E7 | Dependencies: runtime/dev deps ⊆ allowlist |
| E8-E10 | Imports: forbidden imports, path exceptions, cross-layer |
| E11-E12 | Config: composite flag, exports_map |
| E13 | Circular package dependencies (global DFS) |
| E14 | Public API surface stability (export count) |
| E15 | Port-implementation parity (every I*Repo has a Drizzle* impl) |

## CI Gates (ESLint)

| Gate | Package | What it bans |
|------|---------|-------------|
| CIG-02 | @afenda/finance | `Number()*rate`, `parseFloat()*rate`, `Math.round(x*rate)` |
| CIG-03 | @afenda/finance | `req.query as Record<...>`, `req.params as {...}` type casts |
| CIG-04 | @afenda/eslint-config (all apps) | Direct `@afenda/db`, `drizzle-orm`, `drizzle-kit` imports in routes/handlers/pages |

## Options

| Flag | Purpose |
|------|---------|
| `--pkg @afenda/finance` | Check a single package |
| `--fix` | Auto-create missing directories |
| `--json` | JSON output for CI |

## Reference

See `docs/ARCHITECTURE-SPEC.md` for the full governance specification.
