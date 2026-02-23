# AFENDA-NEXUS Documentation

Modern ERP SaaS — Finance-First Modular Monolith.

## Quick Start

```bash
pnpm install          # resolve workspace dependencies
pnpm typecheck        # verify all packages compile
pnpm drift            # validate monorepo structure vs PROJECT.md
pnpm dev              # start web + api + worker (hot reload)
```

## Monorepo Layout

| Layer | Packages | Purpose |
|-------|----------|---------|
| **Config** | `typescript-config`, `eslint-config` | Shared TS/ESLint presets |
| **Core libs** | `core`, `contracts`, `authz`, `db`, `platform` | Domain primitives, DTOs, auth, DB, cross-cutting |
| **Modules** | `modules/finance` | GL kernel + posting engine (P0) |
| **Industry** | `industry/fnb`, `industry/manufacturing`, `industry/agriculture` | Vertical overlays |
| **Apps** | `apps/api`, `apps/web`, `apps/worker` | Fastify API, Next.js UI, Graphile Worker |
| **Tools** | `tools/drift-check`, `tools/generators`, `tools/scripts` | CI gates, scaffolding, ad-hoc scripts |

## Key Documents

- **[PROJECT.md](../PROJECT.md)** — Architecture, conventions, tech stack (single source of truth)
- **ARCHITECTURE.*.md** — Per-package architecture docs (in each package root)
- **`.afenda/project.manifest.json`** — Machine-readable package registry

## Automation

| Command | Purpose |
|---------|---------|
| `pnpm gen:module <name>` | Scaffold new domain module |
| `pnpm gen:table <name>` | Table + migration + RLS stub |
| `pnpm gen:endpoint <m> <verb> <path>` | REST handler stub |
| `pnpm gen:outbox-event <event>` | Outbox payload + worker handler stub |
| `pnpm arch:guard` | Per-package ARCHITECTURE.md governance gate (E1-E15) |
| `pnpm turbo test:coverage` | Run tests with coverage threshold enforcement |
| `node tools/drift-check/src/unused-exports.mjs` | Advisory scan for unused public API exports |
| `pnpm agents:drift` | Validate .agents + monorepo structure |
| `pnpm agents:gen` | Regenerate .agents INDEX.md |

## Future Docs

- `docs/adr/` — Architecture Decision Records
- `docs/deploy/` — Deployment guides
- API docs — generated from `@afenda/contracts` Zod schemas
