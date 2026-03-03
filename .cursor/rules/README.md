# Cursor Rules

Modern `.mdc` format with YAML frontmatter for scoped rules.

## Active Rules

```
.cursor/rules/
  general.mdc              # Tech stack (always applies)
  workflow.mdc             # Dev workflow (always applies)
  react-patterns.mdc       # React patterns (apps/web only)
  nextjs-conventions.mdc   # Next.js patterns (apps/web only)
  lint-clean.mdc           # Lint-clean code (apps/web only)
  supplier-portal.mdc      # Portal coding rules — identity, SoD, timeline, SP-* tracking
  portal-ci-gates.mdc      # Portal CI gates — drift prevention, agent awareness
  portal-data-integrity.mdc # Portal data invariants — RLS, state machines, proof chain
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
- 34+ parallel CI gates (32 existing + portal gates added in Phase 0)
- ESLint + TypeScript
- Portal-specific gates: `GATE-PORTAL-01` through `GATE-PORTAL-08`

**Test locally**: `pnpm ci:gates:parallel`

### Portal-Specific Gate Summary

| Gate             | What                                             | Script                          |
| ---------------- | ------------------------------------------------ | ------------------------------- |
| `GATE-PORTAL-01` | Supplier-safe language (no internal label leaks) | `gate-portal-supplier-safe.mjs` |
| `GATE-PORTAL-02` | PortalRequestContext enforcement                 | `gate-portal-identity.mjs`      |
| `GATE-PORTAL-03` | Idempotency on mutations                         | `gate-portal-idempotency.mjs`   |
| `GATE-PORTAL-04` | Timeline transaction integrity                   | `gate-portal-timeline-tx.mjs`   |
| `GATE-PORTAL-05` | Proof chain continuity                           | `gate-portal-proof-chain.mjs`   |
| `GATE-PORTAL-06` | Kernel import boundary                           | `gate-kernel-invariants.mjs`    |
| `GATE-PORTAL-07` | SoD enforcement on critical actions              | `gate-portal-sod.mjs`           |
| `GATE-PORTAL-08` | Rate limiting on mutations                       | `gate-portal-rate-limit.mjs`    |

## References

- Enforcement: `apps/web/docs/REACT-CACHE-ENFORCEMENT.md`
- Skills: `.agents/skills/vercel-react-best-practices/`
- CI gates: `tools/scripts/gate-*.mjs`
