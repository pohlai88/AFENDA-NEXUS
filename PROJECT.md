# Modern ERP SaaS — Project Architecture & Best Practices (Finance-First)

This document defines the architecture, patterns, and conventions for a **modern ERP SaaS** that is **sound, functioning, easy to manage**, and **intentionally not over-engineered**. **Automation-first:** generators, drift checks, and tooling enforce conventions; manual work is minimized. **Finance (GL + posting) is the spine**; every domain eventually feeds the ledger.

### Runtime Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 20.9+ (LTS) |
| TypeScript | 5.1+ |
| pnpm | 9+ |

---

## 1. Locked-in Tech Stack (No Optional Choices)

| Area | Final Choice | Rationale |
|------|--------------|-----------|
| **Monorepo** | pnpm + Turborepo | Fast dev loops, clean internal packages, scalable without microservices |
| **Web** | Next.js 16 (Node runtime) | Turbopack default, Cache Components, full Node APIs; no edge constraints |
| **UI** | Tailwind CSS + shadcn/ui (Radix) | Design system, accessible by default (WCAG 2.2) |
| **API** | Fastify (TypeScript) | Lightweight modular monolith, structured without framework heaviness |
| **Contracts** | Zod as source → `z.toJSONSchema({ target: "openapi-3.0" })` → generated TS client | Single source of truth; OpenAPI for partners/integrations. *Fallback:* `zod-to-json-schema` if edge cases arise |
| **DB** | Managed Postgres (Neon) | Strong default for ERP, RLS isolation; use pooled connection for API, direct for Worker + migrations |
| **ORM + migrations** | Drizzle + drizzle-kit | Typed SQL, deterministic migrations; Drizzle RLS: define policies via `pgPolicy` or `crudPolicy` (Neon) — policies auto-enable RLS |
| **Tenant isolation** | Shared DB + RLS (non-negotiable) | DB-enforced safety rail; Drizzle RLS helpers for Neon |
| **Worker/jobs** | Graphile Worker (separate service in prod) | Postgres-backed jobs, no Redis required, clean ops |
| **Cache** | None initially | Keep ops minimal; add Redis only with proven need |
| **Read replicas** | None initially | Add only when reporting hurts write latency |
| **Seed** | Includes intercompany pair | Validates core ERP requirement from day 1 |
| **DB-per-tenant** | Escape hatch designed (routing + tooling) | Can move whales/regulatory tenants later without rewrite |

---

## 2. Non-Optional Conventions (Guardrails)

1. **Every tenant-owned table has `tenant_id` + RLS enabled** (see RLS Hardening)
2. **API sets `SET LOCAL app.tenant_id` per request/tx** — never filter `tenant_id` manually
3. **Module boundaries:** each module exports only `public.ts`; no cross-module imports except public API
4. **Layer rule:** only `infra/` touches Drizzle/SQL; domain has zero DB imports
5. **No cross-module DB joins** — compose via module queries or read models
6. **Async is Outbox → Worker only** — no side effects inside HTTP handler
7. **Finance truth kernel first:** everything ultimately produces posted journals (GL is the spine)
8. **Idempotency:** posting/mutation endpoints accept `Idempotency-Key`; store `(tenant_id, idempotency_key, command_type, result_ref)` unique — retries must never double-post

---

## 3. Deployment Units (Production)

Production runs **3 processes**:

| Unit | Stack |
|------|-------|
| `apps/web` | Next.js |
| `apps/api` | Fastify API |
| `apps/worker` | Graphile Worker |

**Dev convenience:** You may run all 3 with one command (`pnpm dev`); production remains separate units.

---

## 4. Success Use Cases (Proof the Architecture Works)

| Use Case | Flow | What It Proves |
|----------|------|----------------|
| **Invoice → GL posting** | Create AP invoice → validate tax → post to ledger → emit outbox event → worker generates PDF + sends email | Domain isolation, outbox, multi-company safe |
| **Intercompany transfer** | Create transfer order (Seller Co) → mirror document (Buyer Co) → paired GL entries → consolidation reads both | Intercompany model, ledger-centric |
| **Multi-currency revaluation** | Batch job reads open AR/AP by currency → fetches FX → creates revaluation entries | Worker, batch jobs, currency model |
| **Tenant onboarding** | Provision tenant → seed COA + dimensions → apply RLS → demo data | RLS, multi-tenant provisioning |
| **Industry overlay (F&B)** | F&B module extends inventory with batch/lot + expiry → posts to shared GL | Shared core + industry extension |
| **Audit trail** | Every document change logged with tenant/company/user/timestamp | Audit log, immutable events |

---

## 5. System Diagram

```
Browser
  │
  ▼
Web App (Next.js / React, Node runtime)
  - App shell, routes, UI blocks
  - BFF calls (typed via generated TS client)
  │
  ▼
API App (Fastify, modular by domain)
  - AuthZ + tenant context
  - Domain modules (GL/AP/AR/Inventory/HR/etc.)
  - Outbox for async + integrations
  │
  ├──────────────► Graphile Worker (jobs, outbox relay, long tasks)
  │
  ▼
Postgres (Neon, single primary)
  - Row Level Security (tenant isolation)
  - Ledger + documents + audit log + outbox
```

---

## 6. Tenancy Model (Non-Negotiable)

**Default:** Shared database + RLS.

| Requirement | Implementation |
|-------------|----------------|
| All tenant-owned tables | Include `tenant_id`; RLS enabled; policies use `current_setting('app.tenant_id')` |
| API per transaction | `SET LOCAL app.tenant_id = '<uuid>'` (and optionally `app.user_id`) |
| Manual tenant filtering | **Forbidden** as primary safety — RLS is the mechanism |

The app connects with a **non-owner, non-superuser runtime role** and uses `SET LOCAL app.tenant_id` inside transactions. Table owner bypass is blocked via `FORCE ROW LEVEL SECURITY`.

---

## 6a. RLS Hardening (Required)

Table owners and superusers bypass RLS by default in Postgres. To prevent this:

| Rule | Implementation |
|------|----------------|
| App DB role | MUST NOT be superuser; MUST NOT have `BYPASSRLS` |
| Tenant tables | `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;` |
| Force RLS | `ALTER TABLE <t> FORCE ROW LEVEL SECURITY;` |
| Transaction context | `SET LOCAL app.tenant_id = '<uuid>'` (optionally `app.user_id`) |

---

## 7. Domain Structure (Modular Monolith)

Each module is layered:

```
packages/modules/<domain>/
  domain/      # Pure business rules (no DB, no HTTP)
  app/         # Use-cases, transactions, orchestration
  infra/       # Adapters (Drizzle, Fastify routes, external APIs)
  public.ts    # ONLY public entrypoint for other modules/apps
```

**Dependency rules:**

| Rule | Enforcement |
|------|-------------|
| `apps/*` may import `packages/*` | Lint + TS project references |
| `packages/modules/*` may import `core`, `contracts`, `authz`, `db`, `platform` | Lint |
| Modules may NOT import other modules except via `public.ts` | Lint |
| `packages/db` never imports modules | Lint |
| No cross-module DB joins | Lint |

---

## 8. Backend Architecture: Modular Monolith + Clean Architecture

```
                    ┌──────────────────────────────────────┐
                    │         DOMAIN (innermost)            │
                    │  • Entities, value objects            │
                    │  • Pure functions: validate, compute  │
                    │  • ZERO imports from HTTP/DB/framework│
                    └──────────────┬───────────────────────┘
                                   │ implements
                    ┌──────────────▼───────────────────────┐
                    │      APPLICATION (use-cases)         │
                    │  • Ports (interfaces): IRepo, IEvent  │
                    │  • Services: orchestrate domain      │
                    │  • Transaction boundaries            │
                    └──────────────┬───────────────────────┘
                                   │ implements
                    ┌──────────────▼───────────────────────┐
                    │     INFRASTRUCTURE (adapters)        │
                    │  • DB repositories, HTTP handlers    │
                    │  • Outbox publisher, external APIs   │
                    │  • Only layer that touches drivers   │
                    └─────────────────────────────────────┘
```

---

## 9. Finance-First Spine (P0)

Phase P0 implements the finance truth kernel:

- Chart of Accounts
- Ledger + fiscal periods
- Journal draft → validate → post
- Immutable posted journals
- Trial balance + GL balances
- Multi-currency basics (FX rates, base currency rules)
- Intercompany relationship + mirrored document primitives

**Everything else** (AP/AR/Inventory/etc.) generates finance postings.

### Finance Fact Immutability (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| Journal status | `DRAFT` / `POSTED` / `REVERSED` / `VOIDED` |
| Posted lines | **No updates**; corrections via **reversals** or **adjusting entries** only |
| Period close | Forbid posting to closed period; reopen only via authorized, fully audited procedure |

---

## 10. Async & Integrations (Non-Negotiable)

| Rule | Implementation |
|------|----------------|
| Async work | Transactional Outbox (written in same DB transaction as business change) |
| Worker | Drains outbox; performs side effects (emails, PDFs, webhooks, bank sync, imports) |
| HTTP handlers | **No** direct side effects; emit outbox row only |

### Outbox → Graphile Worker Flow

Graphile Worker uses `LISTEN/NOTIFY`, which requires a **direct** (non-pooled) connection. Outbox drain pattern:

1. **Graphile cron task** (e.g. every 10s) selects unprocessed rows from `outbox`.
2. For each row: enqueue a job to Graphile (or invoke handler directly); mark row processed in same transaction.
3. Graphile Worker runs job handlers (PDF, email, webhook, etc.).

**Connection strings:** `DATABASE_URL` (pooled, for API) and `DATABASE_URL_DIRECT` (for Worker + drizzle-kit migrations).

---

## 11. Escape Hatch: DB-per-Tenant (Designed Now)

Support routing tenants to dedicated databases without changing domain code:

- **Tenant Router** resolves connection string by tenant
- Migration tooling can run across all tenant DBs
- Default remains shared DB + RLS

---

## 12. Monorepo Structure (Convention-Driven)

**Layout** (enforced by `pnpm run drift`):

```
repo/
  apps/
    web/                      # Next.js UI (Node runtime)
    api/                      # Fastify API (modular monolith)
    worker/                   # Graphile Worker runner (prod deploy unit)
  packages/
    core/                     # ids, money, time, result, errors
    contracts/                # Zod DTOs + OpenAPI generation
    authz/                    # policies, roles, permission evaluation
    db/                       # Drizzle schema, migrations, RLS, DbSession
    platform/                 # config, logging, feature flags
    modules/
      finance/                # GL kernel + posting engine (P0)
      inventory/  procurement/  sales/  hr/  projects/  # add via gen:module
    industry/
      fnb/  manufacturing/  agriculture/
  tools/                      # NOT "tooling" — monorepo convention
    generators/               # @afenda/generators — scaffold, gen:module, gen:table, etc.
    drift-check/              # @afenda/drift-check — CI gate, structure validation
    scripts/                  # ad-hoc scripts
  docs/
```

**Naming:** Use `tools/*` (aligned with pnpm/monorepo best practice). Each tool is a separate package (`@afenda/generators`, `@afenda/drift-check`). Avoid single monolithic "cli" packages.

---

## 13. Automation-First Developer Experience

### Commands (All Offline-Capable)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | web + api + worker + postgres — hot reload |
| `pnpm drift` | Validate structure vs PROJECT.md — CI gate, fails on drift |
| `pnpm db:reset` | migrate + seed demo tenant — fresh state |
| `pnpm gen:module <name>` | New domain module (domain/app/infra) |
| `pnpm gen:table <name>` | Table + migration + RLS policy stub |
| `pnpm gen:endpoint <m> <verb> <path>` | REST handler stub |
| `pnpm gen:outbox-event <event>` | Outbox payload + worker handler stub |
| `pnpm arch:guard` | Per-package ARCHITECTURE.md governance — CI gate, validates deps/imports/structure (E1-E15) |
| `pnpm turbo test:coverage` | Run tests with coverage enforcement (thresholds: 80/80/75/80) |
| `node tools/drift-check/src/unused-exports.mjs` | Advisory scan for unused public API exports |

**Drift gate:** CI runs `pnpm run drift` and `pnpm arch:guard` before lint/build. Structure changes require updating `tools/drift-check` and PROJECT.md together. Per-package boundary changes require updating the relevant `ARCHITECTURE.*.md` frontmatter (see `docs/ARCHITECTURE-SPEC.md`).

### Generators (@afenda/generators)

| Generator | Output |
|-----------|--------|
| `gen:module <name>` | `packages/modules/<name>/` with domain/app/infra + public.ts |
| `gen:table <name>` | Migration, RLS policy, typed repository stub |
| `gen:endpoint <module> <verb> <path>` | Handler stub, OpenAPI spec, typed client (manual wiring) |
| `gen:outbox-event <event>` | Outbox payload type + worker handler stub |

**Invocation:** `pnpm exec afenda-gen <cmd>` or root scripts. No network required.

### Seed Data (Required)

- 1 tenant
- 2 companies within tenant
- 2 currencies
- 1 intercompany relationship (company A ↔ company B)
- Minimal chart of accounts + sample posted journal

### Env Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled connection (API) — hostname includes `-pooler` |
| `DATABASE_URL_DIRECT` | Direct connection (Worker, drizzle-kit) — no pooler |

### Local Parity Checklist

- [ ] Postgres runs via Docker Compose (or Neon local)
- [ ] `.env.example` documents every variable
- [ ] Worker processes outbox in same process for dev (single `pnpm dev`)
- [ ] Seed includes intercompany pair for testing

---

## 14. Easy Management (Ops + Day-to-Day)

| Command | Purpose |
|---------|---------|
| `pnpm drift` | Structure validation — CI gate |
| `pnpm build` | Build all apps + packages |
| `pnpm test` | Run unit + integration tests |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:rollback` | Rollback last migration (with caution) |
| `pnpm lint` | ESLint + dependency-rule checks |
| `pnpm typecheck` | TS strict mode across monorepo |

**RLS migrations:** Use `drizzle-kit generate` + `drizzle-kit migrate` (not `push`). `push` may not apply RLS policies correctly.

| Endpoint/Asset | Purpose |
|----------------|---------|
| `GET /health` | Liveness |
| `GET /health/ready` | Readiness (DB reachable, migrations applied) |
| Structured logs (JSON) | `platform/logging` — tenant_id, trace_id, level |
| Outbox lag metric | Worker behind? Alert. |

**Config:** 12-factor via env vars; feature flags in `platform/feature-flags`.

---

## 15. Domain Model: Multi-Company + Intercompany + International

| Dimension | Purpose |
|-----------|---------|
| **Tenant (Org)** | Customer boundary |
| **Company (Legal Entity)** | Statutory boundary |
| **Business Unit / Site** | Operational boundary |
| **Ledger** | Accounting boundary (COA + currency + calendar + policies) |
| **Counterparty** | Customer / vendor / intercompany partner |
| **Jurisdiction** | Tax + reporting rules |
| **Currency + FX sources** | Multi-currency postings & revaluation |

**Intercompany:** Explicit relationship table (seller ↔ buyer, pricing rules); documents mirrored as paired transactions; consolidation reads from standardized ledgers.

---

## 16. Evidence & References

| Pattern | Reference |
|---------|-----------|
| Clean Architecture | Uncle Bob — dependency rule, ports & adapters |
| Modular monolith | [Shopify: Under Deconstruction](https://shopify.engineering/shopify-monolith) |
| Postgres RLS | [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [ALTER TABLE FORCE RLS](https://www.postgresql.org/docs/current/sql-altertable.html) |
| Shared vs per-tenant DB | [Microsoft SaaS Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns) |
| Transactional outbox | [microservices.io](https://microservices.io/patterns/data/transactional-outbox.html) |
| Graphile Worker | [graphile.github.io/worker](https://graphile.github.io/worker/) |
| Monorepo (Turborepo) | [Turborepo docs](https://turbo.build/repo/docs) |
| Next.js 16 | [Next.js docs](https://nextjs.org/docs) — Turbopack, Cache Components, proxy.ts |
| Drizzle + Neon | [Drizzle Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon), [Neon connection pooling](https://neon.tech/docs/connect/connection-pooling), [Neon RLS + Drizzle](https://neon.tech/docs/guides/rls-drizzle) |
| Zod + OpenAPI | [Zod json-schema](https://zod.dev/json-schema) — `z.toJSONSchema({ target: "openapi-3.0" })`. *Limitation:* recursive refs, exclusive bounds have edge cases; prefer flattened DTO schemas for external APIs. Fallback: `zod-to-json-schema` |
| WCAG 2.2 | [W3C WCAG](https://www.w3.org/WAI/WCAG22/quickref/) |

---

## 17. Implementation Guidelines (Skills & Official Docs)

*Derived from `.agents/skills`: next-best-practices, nextjs-16-complete-guide, optimized-nextjs-typescript, drizzle, zod, monorepo-management, pnpm, form-builder, shadcn-ui, accessibility — plus official documentation.*

### Next.js Data Patterns

| Use Case | Pattern | Notes |
|----------|---------|-------|
| Reads in Server Components | Fetch directly (no API) | Direct DB; no client-server waterfall |
| Mutations from UI | Server Actions | Progressive enhancement; `'use server'` |
| External API / webhooks / mobile | Route Handlers | OpenAPI; GET cacheable |
| Client reads | Pass from Server Component, or TanStack Query | Prefer passing data down |
| Avoid waterfalls | `Promise.all`, Suspense boundaries, `cache()` preload | Parallel fetch; stream with fallbacks |

**RSC rules:** No async client components; props Server→Client must be JSON-serializable; use `.toISOString()` for Date, plain objects for class instances.

**Async APIs (Next 15+):** `params`, `searchParams`, `cookies()`, `headers()` are `Promise<>`—always await. [Official guidance](https://nextjs.org/docs/messages/sync-dynamic-apis)

**Next.js 16:** Turbopack is default for `next dev` and `next build`. `proxy.ts` replaces Node-runtime `middleware.ts` (Edge middleware is deprecated). Cache Components / PPR is enabled via `cacheComponents: true` in next.config; use `'use cache'` to explicitly cache routes/components/functions. *Stable fallback:* if Cache Components cause issues, disable and use traditional `unstable_cache` / route segment config.

### Forms

| Stack | Purpose |
|-------|---------|
| React Hook Form | Form state, minimal re-renders |
| Zod | Schema validation |
| @hookform/resolvers | Connects RHF + Zod |
| shadcn Form | Accessible form primitives (Label, Input, etc.) |

Use semantic `<form>`, `<label>`, `<fieldset>`/`<legend>`; never disabled-state-only for requirements—communicate via visible labels and error messages.

### Drizzle + Neon

| Environment | Connection | Driver | When |
|-------------|------------|--------|------|
| Fastify API | **Pooled** (`-pooler` in hostname) | postgres.js / pg | Web apps; high concurrency |
| Worker + migrations | **Direct** (no pooler) | postgres.js / pg | LISTEN/NOTIFY; drizzle-kit |
| Serverless / edge | Pooled or HTTP | neon-http / neon-serverless | One-shot queries |

**Neon connection rules ([Neon docs](https://neon.tech/docs/connect/connection-pooling)):**

- Pooled: up to 10,000 client connections; PgBouncer transaction mode.
- Direct: required for migrations, `pg_dump`, **LISTEN/NOTIFY** (Graphile Worker), session-level `SET`.
- `SET LOCAL app.tenant_id` is transaction-scoped — use at transaction start; valid within pooled connections for that transaction only.

**RLS:** Define policies via `pgPolicy` or `crudPolicy` (from `drizzle-orm/neon`). Policies auto-enable RLS. [Drizzle RLS](https://orm.drizzle.team/docs/rls) | [Neon RLS + Drizzle](https://neon.tech/docs/guides/rls-drizzle)

### Accessibility (WCAG 2.2)

- **Semantic HTML:** `<button>`, `<header>`, `<nav>`, `<main>`, `<form>`, `<label>`, heading hierarchy
- **Keyboard:** Every interactive element reachable/operable via keyboard; consistent focus indicators
- **Color contrast:** 4.5:1 standard text; 3:1 large text
- **Media:** Alt text for images; captions/transcripts for audio/video
- **Forms:** Errors by more than color; requirements stated; status communicated
- **Skip links:** Before nav and large content blocks
- **`lang` attribute** on `<html>`; `prefers-reduced-motion` respected
- **Tooling:** eslint-plugin-jsx-a11y; prefer shadcn/Radix for accessible components

### Error Handling (Next.js)

- `error.tsx` per route segment (Client Component); `reset()` to retry
- `global-error.tsx` at root (must include `<html>`, `<body>`)
- **Do not** wrap `redirect()` or `notFound()` in try-catch—they throw for control flow
- Use early returns and guard clauses; custom error types for consistency

### Enterprise Code Quality (Minimal, Not Over-Engineered)

| Practice | Implementation |
|---------|----------------|
| **Typed errors** | `Result<T, E>` or domain error classes; never throw ad-hoc strings |
| **Input validation** | Zod at API/DB boundaries; fail fast |
| **Structured logging** | JSON logs with `tenant_id`, `trace_id`, `level`; no `console.log` in prod |
| **Early returns** | Guard clauses; avoid deep nesting |
| **Explicit over implicit** | No magic; clear function names and single responsibility |
| **Strict TypeScript** | `strict: true`; no `any` in public APIs |
| **ESLint** | Enforce dependency rules, no unused vars |
| **Health checks** | `/health` (liveness), `/health/ready` (DB reachable) |

*Avoid:* APM agents, multiple log pipelines, feature-flag overuse, custom metrics until needed.

### Monorepo (Turborepo + pnpm)

- **pnpm-workspace.yaml:** `packages: ['apps/*', 'packages/*', 'packages/modules/*', 'packages/industry/*', 'tools/*']` — use `tools/*` not `tooling/*`
- **Catalog:** Centralize versions in `pnpm-workspace.yaml`; use `catalog:` in package.json
- **turbo.json:** `build` depends on `^build`; `dev` cache: false, persistent: true; `typecheck` depends on `^build`
- **Package exports:** Use `workspace:*` for internal deps; explicit `exports` in package.json
- **Drift gate:** `pnpm run drift` validates layout; CI runs it as first gate. Extend `tools/drift-check` when adding apps/packages.

---

## 18. Quick Reference Checklist

### Architecture
- [ ] All tenant tables have `tenant_id` + RLS enabled + FORCE ROW LEVEL SECURITY
- [ ] App DB role is non-superuser, non-BYPASSRLS
- [ ] API sets `SET LOCAL app.tenant_id` per transaction
- [ ] Posting endpoints accept `Idempotency-Key`; idempotency store is unique per (tenant, key, type)
- [ ] Domain layer has zero framework/DB imports
- [ ] Cross-module calls use public APIs only (`public.ts`)
- [ ] Async work uses transactional outbox
- [ ] Frontend consumes typed contracts (generated TS client)
- [ ] Intercompany has explicit relationship table
- [ ] Ledger/consolidation reads from standardized sources

### Automation & DX
- [ ] `pnpm drift` runs and passes (structure matches PROJECT.md)
- [ ] `pnpm dev` runs full stack with hot reload
- [ ] Generators (@afenda/generators) scaffold module, table, endpoint
- [ ] Seed data includes intercompany pair
- [ ] Typed API client auto-generated from OpenAPI

### Frontend & Accessibility
- [ ] Server Components for reads; Server Actions for mutations
- [ ] React Hook Form + Zod + shadcn for forms
- [ ] `next/image` for all images; semantic HTML; keyboard accessible
- [ ] WCAG 2.2: contrast, alt text, skip links, `lang` attribute

### Neon & Connections
- [ ] API uses pooled `DATABASE_URL`; Worker and migrations use `DATABASE_URL_DIRECT`
- [ ] Outbox drained by Graphile cron or dedicated task; Worker uses direct connection (LISTEN/NOTIFY)

### Finance & DB
- [ ] `gl_journal` status: DRAFT/POSTED/REVERSED/VOIDED; no updates to POSTED lines
- [ ] Period close forbids posting; reopen is authorized + audited
- [ ] RLS migrations use `drizzle-kit generate` + `migrate` (not `push`)

### Management
- [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` work
- [ ] `/health` and `/health/ready` endpoints exist
- [ ] Config via env vars; `.env.example` documented
- [ ] Monorepo dependency rules enforced by lint

---

**v2.2** — All audit gaps closed. Finance P0 entities complete (Ledger, FxRate, GlBalance, Intercompany). Generators functional. Outbox pattern scaffolded. Real pino logger. Balance validation + idempotency enforcement in postJournal(). shadcn/ui configured. Graphile Worker wired.

### Scaffolding Status

| Package | Status | Notes |
|---------|--------|-------|
| `packages/core` | ✅ Complete | Branded IDs, Money, Result, AppError, DateRange |
| `packages/contracts` | ✅ Complete | Zod DTOs (Pagination, Journal, PostJournal schemas) |
| `packages/authz` | ✅ Complete | Roles, permissions, policy evaluation (`can`, `assertCan`) |
| `packages/db` | ✅ Complete | DbSession, Outbox (OutboxRow/Writer/Drainer), schema stubs, migrate util |
| `packages/platform` | ✅ Complete | Real pino logger, Zod-validated config, feature flags |
| `packages/modules/finance` | ✅ Complete | Journal, Account, Ledger, FiscalPeriod, FxRate, GlBalance, TrialBalance, Intercompany; postJournal with balance validation + idempotency |
| `packages/industry/fnb` | ✅ Stub | Overlay config pattern |
| `packages/industry/manufacturing` | ✅ Stub | Overlay config pattern |
| `packages/industry/agriculture` | ✅ Stub | Overlay config pattern |
| `packages/typescript-config` | ✅ Complete | base, library, fastify, nextjs presets |
| `packages/eslint-config` | ✅ Complete | Flat config + typescript-eslint parser |
| `apps/api` | ✅ Complete | Fastify server + `/health` + `/health/ready` routes |
| `apps/web` | ✅ Complete | Next.js App Router + Tailwind + shadcn/ui configured |
| `apps/worker` | ✅ Complete | Graphile Worker dep + background job processor |
| `tools/drift-check` | ✅ Complete | Manifest-driven structure validator |
| `tools/generators` | ✅ Complete | gen:module, gen:table, gen:endpoint, gen:outbox-event (all functional) |
| `tools/scripts` | ✅ Created | Ad-hoc scripts directory |

### Audit Status (2026-02-24)

| Metric | Value |
|--------|-------|
| Typecheck | 18+ packages pass |
| Turbo CI | 39/39 tasks (typecheck + lint + test + build) |
| Arch guard | 294/294 pass, 0 fail, 0 warn (E1-E15) |
| Finance tests | 330 pass, 29 skipped (integration), 0 failures |
| Property tests | 17 pass (12 pure + 5 DB-backed, fast-check) |
| Audit findings | 21 found → **21 closed** (3 DEFECTs, 15 GAPs, 3 OBS) |
| AIS benchmark | 39/41 pass (v2.0, evidence levels L1-L5) |
| SOX ITGC | 12/12 pass (AC/CM/OPS/DI controls, WARN mode) |
| CI gates | CIG-02 (FX precision), CIG-03 (unsafe casts), CIG-04 (no DB in routes), E13-E15 (circular deps, API surface, port parity) |

### Audit & Benchmarking Tools

| Script | Command | Description |
|--------|---------|-------------|
| `audit:ais` | `pnpm audit:ais [--json]` | 41-item AIS benchmark with evidence levels |
| `audit:sox` | `pnpm audit:sox [--json] [--fail]` | 12 SOX ITGC controls (WARN default) |
| `audit:pack` | `pnpm audit:pack [--output file]` | Consolidated evidence pack (AIS + SOX) |
| `audit:export` | `pnpm audit:export -- --tenant-id <uuid>` | DB audit log export |
| `test:property` | `pnpm --filter @afenda/finance test:property` | Property-based invariant tests |

*Last updated: 2026-02-24*
