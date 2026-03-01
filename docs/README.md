# AFENDA-NEXUS Documentation

Modern ERP SaaS — Finance-First Modular Monolith.

## Quick Start

```bash
pnpm install          # resolve workspace dependencies
pnpm typecheck        # verify all packages compile
pnpm drift            # validate monorepo structure vs PROJECT.md
pnpm dev              # start web + api + worker (hot reload)
```

## Local Auth Env

For `apps/web` local builds, create `apps/web/.env.local` with the Neon Auth
configuration (cookie secret minimum 32 characters):

```bash
# Each Neon branch has its own Auth URL:
# https://<endpoint-id>.neonauth.<region>.aws.neon.tech/neondb/auth
#
# Use the helper script to create a dev branch and get env vars:
pnpm branch:env
```

Or set manually:

```bash
NEON_AUTH_BASE_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=your-32-plus-char-secret
```

Without `NEON_AUTH_BASE_URL`, dev mode falls back to trusted headers
(`x-tenant-id` / `x-user-id`).

### Branch Auth Isolation

When you create a Neon branch, auth data (users, sessions, OAuth config) is
cloned automatically. Each branch operates independently:

- Sessions do NOT transfer between branches (cookies are domain-scoped).
- OAuth providers and JWKS keys are copied from the parent.
- Changes in one branch never affect another.

See the [branching auth docs](https://neon.tech/docs/guides/neon-auth-branching)
and [architecture.db.md](../packages/db/architecture.db.md) for details.

### Multi-Tenancy (Organizations)

Neon Auth includes the Better Auth organization plugin. Users create/join
organizations; the active org ID is stored in the session and used as `tenantId`
for RLS and API authorization. Role resolution uses `neon_auth.member`.

**Production trusted domains:** Add your app URLs so OAuth and email
verification redirects work:

```bash
NEON_API_KEY=your-key node tools/scripts/neon-auth-trusted-domains.mjs https://myapp.com
```

Or via **Console → Auth → Configuration → Domains**. See
[Configure domains](https://neon.com/docs/auth/guides/configure-domains).

## Monorepo Layout

| Layer         | Packages                                                         | Purpose                                          |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| **Config**    | `typescript-config`, `eslint-config`                             | Shared TS/ESLint presets                         |
| **Core libs** | `core`, `contracts`, `authz`, `db`, `platform`                   | Domain primitives, DTOs, auth, DB, cross-cutting |
| **Modules**   | `modules/finance`                                                | GL kernel + posting engine (P0)                  |
| **Apps**      | `apps/api`, `apps/web`, `apps/worker`                            | Fastify API, Next.js UI, Graphile Worker         |
| **Tools**     | `tools/drift-check`, `tools/generators`, `tools/graphviz`, `tools/scripts` | CI gates, scaffolding, dep-graph visualisation, ad-hoc scripts |

## Key Documents

- **[PROJECT.md](../PROJECT.md)** — Architecture, conventions, tech stack
  (single source of truth)
- **ARCHITECTURE.\*.md** — Per-package architecture docs (in each package root)
- **`.afenda/project.manifest.json`** — Machine-readable package registry

## CI Gates (Governance & Drift Prevention)

| Command                 | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `pnpm ci:gates`         | Full governance suite (arch, drift, db, neon, audit) |
| `pnpm ci:gates:fast`    | Quick subset (test-dir, db:ci, format)               |
| `pnpm arch:guard`       | Per-package ARCHITECTURE.md (E1–E16)                 |
| `pnpm drift`            | Monorepo structure vs manifest                       |
| `pnpm agents:drift`     | .agents ↔ PROJECT.md                                 |
| `pnpm web:drift`        | Frontend rules (W01–W16)                             |
| `pnpm db:ci`            | Schema ↔ migrations sync                             |
| `pnpm neon:sync`        | db:check + db:ci + optional env validation           |
| `pnpm audit:ais`        | AIS benchmark (41 items)                             |
| `pnpm audit:sox --fail` | SOX ITGC (12 controls)                               |

All gates run in `.github/workflows/ci.yml` (guards job) and `preview.yml`
(db:ci, check:test-dir).

## Automation

| Command                                         | Purpose                                       |
| ----------------------------------------------- | --------------------------------------------- |
| `pnpm gen:module <name>`                        | Scaffold new domain module                    |
| `pnpm gen:table <name>`                         | Table + migration + RLS stub                  |
| `pnpm gen:endpoint <m> <verb> <path>`           | REST handler stub                             |
| `pnpm gen:outbox-event <event>`                 | Outbox payload + worker handler stub          |
| `pnpm turbo test:coverage`                      | Run tests with coverage threshold enforcement |
| `node tools/drift-check/src/unused-exports.mjs` | Advisory scan for unused public API exports   |
| `pnpm graph`                                    | Dependency graph + orphan/lineage analysis    |
| `pnpm graph:full`                               | Full analysis + SVG render + JSON report      |
| `pnpm agents:gen`                               | Regenerate .agents INDEX.md                   |

## Future Docs

- `docs/adr/` — Architecture Decision Records
- `docs/deploy/` — Deployment guides
- API docs — generated from `@afenda/contracts` Zod schemas
