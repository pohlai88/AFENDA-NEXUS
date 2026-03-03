# Architecture — @afenda/supplier-kernel

> Supplier Portal 2.0 kernel package.  
> Phase 0 foundation: pure domain logic, ports, types — no I/O, no DB, no HTTP.

## Purpose

`@afenda/supplier-kernel` is the **shared kernel** for the Supplier Portal 2.0.
It contains all pure-logic components that portal services, routes, and frontend
depend on.

The kernel is designed as a **dependency-free domain layer**:

- **No `@afenda/db`** — kernel never imports database schemas or Drizzle
- **No `@afenda/modules`** — kernel never imports application services
- **No HTTP framework** — no Fastify, no Next.js references

## Package Boundary (ESLINT-PORTAL-03)

```
@afenda/supplier-kernel
├── CAN import: @afenda/core, @afenda/contracts, @afenda/authz, node:crypto
└── CANNOT import: @afenda/db, @afenda/modules/*, @afenda/platform, @afenda/storage
```

This is enforced by ESLint `no-restricted-imports` in `eslint.config.js`.

## Exports

| Export Path                       | Entry Point            | Contents                                                                                                                                 |
| --------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@afenda/supplier-kernel`         | `src/index.ts`         | All kernel components (context, permissions, status, identity, notifications, audit, proof, attachments, case-id, idempotency, registry) |
| `@afenda/supplier-kernel/domain`  | `src/domain/index.ts`  | Pure state machines + calculators (case FSM, payment FSM, SLA calc, bulk fingerprint)                                                    |
| `@afenda/supplier-kernel/testing` | `src/testing/index.ts` | Mock implementations of all ports + `createTestContext()` factory                                                                        |

## Component Registry (SP-\* Codes)

### SP-1000: Kernel Infrastructure

| Code    | Module            | File                                                  | Description                                                                               |
| ------- | ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| SP-1001 | Identity          | `src/identity/portal-identity.ts`                     | `PortalIdentityResult` interface + `IPortalIdentityResolver` port                         |
| SP-1002 | Permissions       | `src/permissions/portal-permissions.ts`               | Role→permission checks, SoD rules, role hierarchy                                         |
| SP-1003 | Status Dictionary | `src/status/portal-status-dictionary.ts`              | Single source of truth for all supplier-visible status labels                             |
| SP-1004 | Notifications     | `src/notifications/portal-notification-dispatcher.ts` | 16 notification types + `IPortalNotificationDispatcher` port                              |
| SP-1005 | Audit             | `src/audit/portal-audit-hook.ts`                      | `PortalAuditEntry` type + `IPortalAuditWriter` port                                       |
| SP-1006 | Proof Chain       | `src/proof/proof-chain-writer.ts`                     | 21 event types, SHA-256 hash chain, verify segment                                        |
| SP-1007 | Attachments       | `src/attachments/portal-attachment-policy.ts`         | Size/MIME/extension validation, file checksumming                                         |
| SP-1008 | Case ID           | `src/case-id/portal-case-id.ts`                       | `CASE-{TENANT}-{YYYY}-{SEQ}` format + `ICaseIdGenerator` port                             |
| SP-1009 | Idempotency       | `src/idempotency/portal-idempotency.ts`               | `IPortalIdempotencyStore` port, key extraction/validation                                 |
| SP-1010 | Context           | `src/context/portal-request-context.ts`               | `PortalRequestContext` immutable envelope, `createPortalContext()`, `derivePermissions()` |

### SP-4000: Domain Logic (Pure)

| Code    | Module           | File                                    | Description                                                                    |
| ------- | ---------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| SP-4001 | Case FSM         | `src/domain/case-state-machine.ts`      | 8 statuses, transition rules, terminal/active helpers                          |
| SP-4002 | Payment FSM      | `src/domain/payment-stage-machine.ts`   | 7 stages, source precedence (BANK_FILE > ERP > MANUAL), append-only fact model |
| SP-4003 | SLA Calculator   | `src/domain/sla-calculator.ts`          | 4 priorities × 8 categories matrix, deadline/breach/progress computation       |
| SP-4004 | Bulk Fingerprint | `src/domain/bulk-upload-fingerprint.ts` | SHA-256 row dedup, 3 dedupe policies                                           |

## Ports (Dependency Inversion)

The kernel defines **5 ports** (interfaces) that are implemented outside the
kernel:

| Port                                      | File                 | Implementor                                             |
| ----------------------------------------- | -------------------- | ------------------------------------------------------- |
| `IPortalIdentityResolver`                 | `src/identity/`      | `@afenda/modules` (AP slice)                            |
| `IPortalNotificationDispatcher`           | `src/notifications/` | `@afenda/modules` or `@afenda/platform`                 |
| `IPortalAuditWriter`                      | `src/audit/`         | `@afenda/modules` (writes to audit table)               |
| `IProofChainWriter` / `IProofChainReader` | `src/proof/`         | `@afenda/modules` (extends TamperResistantOutboxWriter) |
| `ICaseIdGenerator`                        | `src/case-id/`       | `@afenda/modules` (uses DB sequence)                    |
| `IPortalIdempotencyStore`                 | `src/idempotency/`   | `@afenda/modules` (uses IIdempotencyStore)              |

All ports have mock implementations in `src/testing/index.ts` for unit testing.

## Role & Permission Model

### 4 Supplier Roles (hierarchical)

```
PORTAL_OWNER      → 20 permissions (all)
PORTAL_FINANCE    → 18 permissions (no USER_MANAGE, API_KEY_MANAGE)
PORTAL_OPERATIONS → 12 permissions (operations-focused, no finance mutations)
PORTAL_READONLY   →  8 permissions (read-only)
```

### 3 Buyer Roles (non-hierarchical)

```
PORTAL_AGENT                → Handles assigned cases
PORTAL_MANAGER              → Supervises agents, manages assignments
PORTAL_EXECUTIVE_ESCALATION → Handles executive escalations
```

### 3 SoD Rules

1. Bank account proposer ≠ approver
2. API key creator ≠ activator
3. Case resolver ≠ reopener

## Status Dictionary (SP-LANG-01)

All supplier-visible status labels are defined in `portal-status-dictionary.ts`.

**8 categories**: invoice, payment, case, compliance, onboarding, document,
escalation, bank_account.

**Key language rules**:

- No internal hold reasons (`FRAUD_SUSPICION`, `SANCTIONS_HIT`) ever exposed to
  portal
- "Rejected" → "Returned" or "Unsuccessful" in supplier-facing labels
- All labels tested against supplier-hostile language in unit tests

## Testing

```bash
# Run kernel tests
pnpm --filter @afenda/supplier-kernel exec vitest run

# Run with coverage
pnpm --filter @afenda/supplier-kernel exec vitest run --coverage
```

**182 tests** across 10 test files covering:

- Case state machine transitions (valid + invalid, 39 tests)
- Payment stage machine transitions + source precedence (36 tests)
- SLA deadline/breach/progress calculations (15 tests)
- Bulk upload fingerprint SHA-256 dedup (8 tests)
- Portal context creation + permission derivation (18 tests)
- Portal permissions + SoD conflict detection (18 tests)
- Status dictionary lookups + supplier-safe language (17 tests)
- Case ID format/parse round-trip (8 tests)
- Attachment validation (size/MIME/extension blocking, 15 tests)
- Idempotency key extraction + UUID validation (8 tests)

## Contracts (SP-2000)

Portal Zod schemas are in `packages/contracts/src/portal/index.ts` and
re-exported from the main contracts barrel:

- `PortalRoleSchema`, `ActorTypeSchema`
- `PortalErrorSchema` (error envelope)
- `ListResponseSchema<T>` (generic paginated response)
- Case contracts: `CreateCaseSchema`, `CaseResponseSchema`,
  `CaseListQuerySchema`, `CaseListResponseSchema`
- Timeline: `TimelineEntrySchema`, `TimelineListResponseSchema`
- Payment: `PaymentStageSchema`, `PaymentStatusFactSchema`
- Proof: `ProofChainVerifyResultSchema`

## Build

```bash
pnpm --filter @afenda/supplier-kernel build    # tsup → ESM
pnpm --filter @afenda/supplier-kernel typecheck # tsc --emitDeclarationOnly
```

## Dependency Graph

```
@afenda/supplier-kernel
├── @afenda/core         (TenantId, etc.)
├── @afenda/contracts    (Zod schemas)
└── @afenda/authz        (base permission types)
```

No circular dependencies. Kernel is a leaf in the dependency tree.
