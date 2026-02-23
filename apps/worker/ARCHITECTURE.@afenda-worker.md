---
package: "@afenda/worker"
root_dir: "apps/worker"
type: app
layer: deployment
composite: false
entrypoints: ["src/index.ts"]
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/db", "@afenda/platform", "graphile-worker", "postgres"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "@types/node", "tsup", "tsx", "typescript", "vitest"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/"]
  forbidden_imports: ["next", "react", "fastify"]
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/worker

## Purpose
Background job processor — drains the transactional outbox (`erp.outbox`) and dispatches events to registered handlers.

## Not a library
Leaf app — NOT consumed by other packages, NOT in root `tsconfig.json` references.

## Implementation

### Outbox Drain Pattern (§10 compliance)
1. Worker starts with `createDirectClient()` (bypasses PgBouncer for LISTEN/NOTIFY)
2. `createOutboxDrainer(db)` from `@afenda/db` provides `drain()` + `markProcessed()`
3. `drain()` uses `SELECT ... FOR UPDATE SKIP LOCKED` for safe concurrent processing
4. Events dispatched via `EventHandlerRegistry` — lookup by `eventType` string
5. Polling loop: every 5s, batch size 50. Failed events are NOT marked processed (retry on next poll).

### Event Handler Registry
- `createEventHandlerRegistry(logger)` — register/dispatch pattern
- `registerFinanceHandlers()` — registers handlers for: `JOURNAL_POSTED`, `GL_BALANCE_CHANGED`, `JOURNAL_REVERSED`, `JOURNAL_VOIDED`, `IC_TRANSACTION_CREATED`
- Unregistered event types log a warning (no crash)

### Files
- `src/index.ts` — Entry point, poll loop
- `src/event-handlers.ts` — Registry + finance handler stubs
- `src/event-handlers.test.ts` — 5 unit tests

### Testing
- 5 unit tests (vitest): dispatch, unregistered warning, multiple types, overwrite, finance handlers
