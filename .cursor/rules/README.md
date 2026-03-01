# Cursor Rules

Modern `.mdc` format with YAML frontmatter for scoped rules.

## Active Rules

```
.cursor/rules/
  general.mdc              # Tech stack (always applies)
  workflow.mdc             # Dev workflow (always applies)
  react-patterns.mdc       # React patterns (apps/web only)
  nextjs-conventions.mdc   # Next.js patterns (apps/web only)
```

## Key Enforcements

### 1. React cache() (RBP-CACHE)

**CRITICAL**: All server data fetchers must use `cache()`:

```typescript
import { cache } from 'react';
export const fetchData = cache(async (ctx) => { ... });
```

**Enforced by**: ESLint + `gate:react-cache` CI gate

### 2. Report Generation

**DO NOT create reports >50 lines** without explicit approval:
- ❌ "combine analysis" ≠ permission for 500-line report
- ✅ "write detailed report" = permission
- Always confirm length expectations first

### 3. Code Comments

Only explain non-obvious intent. No obvious/redundant comments.

### 4. File Creation

Prefer editing existing files over creating new ones.

## Rule Scoping

- `alwaysApply: true` — Always active
- `globs: [...]` — File pattern matching
- Use `@Cursor Rules` in chat to reference

## CI Integration

Rules are enforced by:
- Pre-commit hooks (lint-staged)
- 34 parallel CI gates
- ESLint + TypeScript

**Test locally**: `pnpm ci:gates:parallel`

## References

- Enforcement: `apps/web/docs/REACT-CACHE-ENFORCEMENT.md`
- Skills: `.agents/skills/vercel-react-best-practices/`
- CI gates: `tools/scripts/gate-*.mjs`
