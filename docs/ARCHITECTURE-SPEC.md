# ARCHITECTURE.md Governance Specification

> **Status:** Ratified  
> **Enforced by:** `pnpm arch:guard` → `tools/drift-check/src/arch-guard.mjs`  
> **Scope:** Every package in `.afenda/project.manifest.json`

This document is the **single source of truth** for per-package architecture
governance in the AFENDA-NEXUS monorepo. Each package self-describes its rules
via YAML frontmatter in an `ARCHITECTURE.*.md` file. The `arch-guard` tool
validates the codebase against these declarations and fails CI on violations.

---

## §A. Frontmatter Schema (Normative)

Every managed package MUST have an `ARCHITECTURE.@<scope>-<name>.md` file at its
root with this YAML frontmatter:

```yaml
---
# ─── Identity ─────────────────────────────────────
package: "@afenda/core"                    # npm name — MUST match package.json "name"
root_dir: "packages/core"                  # path from repo root — MUST match manifest
type: library | app | config | tool        # package category
layer: domain-primitives | contracts | authorization | infrastructure |
       platform | module | industry-overlay | deployment | tool | null

# ─── TypeScript Config ────────────────────────────
composite: true | false                    # MUST match tsconfig.json "composite"
entrypoints: ["src/index.ts"]              # main source entrypoints
public_api: "src/public.ts" | null         # module boundary file (modules/overlays only)

# ─── Package Exports ──────────────────────────────
exports_map:                               # MUST match package.json "exports" (null for apps)
  ".": { import: "./dist/index.js", types: "./dist/index.d.ts" }

# ─── Dependency Governance ────────────────────────
dependency_kinds:
  allowed_runtime: []                      # exhaustive allowlist for "dependencies"
  allowed_dev: []                          # exhaustive allowlist for "devDependencies"
  allowed_peer: []                         # exhaustive allowlist for "peerDependencies"

# ─── File/Directory Structure ─────────────────────
enforced_structure:
  required_files: ["src/index.ts", "package.json", "tsconfig.json"]
  required_directories: ["src"]

# ─── Import Boundary Rules ────────────────────────
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core"]
  forbidden_imports: ["drizzle-orm", "fastify"]
  allow_imports_by_path:
    "src/infra/routes/**": ["fastify"]
    "src/infra/repositories/**": ["drizzle-orm"]
  forbid_cross_layer_imports:
    - { from: "src/domain/**", forbid: ["src/app/**", "src/infra/**"] }
    - { from: "src/app/**", forbid: ["src/infra/**"] }
---
```

### Field Reference

| Field                                       | Type           | Required | Description                                            |
| ------------------------------------------- | -------------- | -------- | ------------------------------------------------------ |
| `package`                                   | string         | Yes      | npm package name — must match `package.json` `name`    |
| `root_dir`                                  | string         | Yes      | Relative path from repo root                           |
| `type`                                      | enum           | Yes      | `library`, `app`, `config`, or `tool`                  |
| `layer`                                     | enum \| null   | Yes      | Architectural layer (see §B)                           |
| `composite`                                 | boolean        | Yes      | Must match `tsconfig.json` `compilerOptions.composite` |
| `entrypoints`                               | string[]       | Yes      | Main source files                                      |
| `public_api`                                | string \| null | Yes      | Module boundary file; null for non-modules             |
| `exports_map`                               | object \| null | Yes      | Must match `package.json` `exports`; null for apps     |
| `dependency_kinds.allowed_runtime`          | string[]       | Yes      | Exhaustive allowlist for `dependencies`                |
| `dependency_kinds.allowed_dev`              | string[]       | Yes      | Exhaustive allowlist for `devDependencies`             |
| `dependency_kinds.allowed_peer`             | string[]       | Yes      | Exhaustive allowlist for `peerDependencies`            |
| `enforced_structure.required_files`         | string[]       | Yes      | Files that MUST exist                                  |
| `enforced_structure.required_directories`   | string[]       | Yes      | Directories that MUST exist                            |
| `boundary_rules.allowed_import_prefixes`    | string[]       | Yes      | What source files MAY import                           |
| `boundary_rules.forbidden_imports`          | string[]       | Yes      | Hard deny list                                         |
| `boundary_rules.allow_imports_by_path`      | object         | Yes      | Path-scoped exceptions to `forbidden_imports`          |
| `boundary_rules.forbid_cross_layer_imports` | array          | Yes      | Intra-package layer isolation rules                    |

---

## §B. Layer Hierarchy (Normative)

Layers form a strict dependency DAG. Lower layers MUST NOT import higher layers.

```
  deployment (apps)          ← may import anything from packages/*
       │
  ┌────┴────────────────┐
  module    industry-overlay  ← may import core, contracts, authz, db, platform
  │              │
  platform       │           ← may import core, pino, zod
  │              │
  infrastructure │           ← may import core, drizzle-orm, postgres
  │              │
  authorization  │           ← may import core
  │              │
  contracts      │           ← may import core, zod
  │              │
  domain-primitives          ← may import NOTHING (innermost)
```

| Layer               | Packages                         | MAY Import                           | MUST NOT Import                            |
| ------------------- | -------------------------------- | ------------------------------------ | ------------------------------------------ |
| `domain-primitives` | core                             | `./` only                            | all other @afenda packages, all frameworks |
| `contracts`         | contracts                        | core, zod                            | db, platform, modules, fastify, drizzle    |
| `authorization`     | authz                            | core                                 | db, platform, modules, fastify, drizzle    |
| `infrastructure`    | db                               | core, drizzle-orm, postgres          | platform, modules, fastify, next           |
| `platform`          | platform                         | core, pino, zod                      | db, modules, fastify, drizzle              |
| `module`            | finance, inventory…              | core, contracts, authz, db, platform | other modules (except via `public.ts`)     |
| `industry-overlay`  | fnb, manufacturing…              | core, finance                        | db, platform directly                      |
| `deployment`        | api, web, worker                 | any @afenda package                  | N/A (leaf apps)                            |
| `config`            | typescript-config, eslint-config | N/A                                  | N/A                                        |
| `tool`              | generators, drift-check          | N/A                                  | N/A                                        |

---

## §C. Naming Convention

| Component        | Pattern                           | Example                                               |
| ---------------- | --------------------------------- | ----------------------------------------------------- |
| File name        | `ARCHITECTURE.@<scope>-<name>.md` | `ARCHITECTURE.@afenda-core.md`                        |
| Scope derivation | `@afenda/core` → `@afenda-core`   | `@afenda/modules/finance` → `@afenda-modules-finance` |
| Location         | Package root directory            | `packages/core/ARCHITECTURE.@afenda-core.md`          |

The file MUST be listed in `package.json` `files` array for library packages
(included in npm publish).

---

## §D. Markdown Body (Informational)

After the closing `---` of the frontmatter, each file SHOULD contain:

```markdown
# @afenda/<name>

## Purpose

1-2 sentence description of the package's role.

## Layer Rules

- Human-readable boundary explanation
- What this package may/must not import and why

## Exports

- Key public API surface (types, functions, classes)
```

The body is **not enforced** by `arch-guard` — it serves as documentation for
developers and AI agents.

---

## §E. Enforcement Rules

The `arch-guard` tool validates each package against its frontmatter. Checks are
ordered by severity.

| #   | Check                                                                                  | Source               | Severity        | Auto-fixable               |
| --- | -------------------------------------------------------------------------------------- | -------------------- | --------------- | -------------------------- |
| E1  | `ARCHITECTURE.*.md` exists for every manifest package (except `unmanaged`)             | manifest             | **FAIL**        | No                         |
| E2  | `package` field matches `package.json` `name`                                          | frontmatter          | **FAIL**        | No                         |
| E3  | `root_dir` field matches actual file location                                          | frontmatter          | **FAIL**        | No                         |
| E4  | Every `required_files` entry exists on disk                                            | `enforced_structure` | **FAIL**        | No                         |
| E5  | Every `required_directories` entry exists on disk                                      | `enforced_structure` | **FAIL**        | Yes (`--fix` creates dirs) |
| E6  | `package.json` `dependencies` ⊆ `allowed_runtime` ∪ `workspace:*`                      | `dependency_kinds`   | **FAIL**        | No                         |
| E7  | `package.json` `devDependencies` ⊆ `allowed_dev` ∪ `workspace:*`                       | `dependency_kinds`   | **FAIL**        | No                         |
| E8  | No source file imports a `forbidden_imports` package                                   | `boundary_rules`     | **FAIL**        | No                         |
| E9  | Path-scoped exceptions (`allow_imports_by_path`) override E8 for matching globs        | `boundary_rules`     | —               | —                          |
| E10 | Cross-layer imports respected per `forbid_cross_layer_imports`                         | `boundary_rules`     | **FAIL**        | No                         |
| E11 | `tsconfig.json` `composite` matches frontmatter `composite`                            | `composite`          | **WARN**        | No                         |
| E12 | `package.json` `exports` matches `exports_map` (when not null)                         | `exports_map`        | **WARN**        | No                         |
| E13 | No circular `@afenda/*` package dependencies (global DFS)                              | `package.json` deps  | **FAIL**        | No                         |
| E14 | `public_api` file exists and has exports (symbol count logged)                         | `public_api`         | **FAIL** / info | No                         |
| E15 | Every port interface (`I*Repo`, `I*Store`, etc.) has an `implements` class in `infra/` | `enforced_structure` | **WARN**        | No                         |
| E16 | No file in a slice imports from another slice directly (must go through `shared/`)     | `slice_isolation`    | **FAIL**        | No                         |

### Import Scanning (E8, E9, E10)

Source files are scanned for import statements using regex:

- `import ... from "pkg"` / `import ... from 'pkg'`
- `import("pkg")` (dynamic imports)
- `require("pkg")` (CJS)

Only `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` files under the package root are
scanned. `node_modules/`, `dist/`, `.next/`, `*.test.*`, `*.spec.*` are
excluded.

### Path-Scoped Exceptions (E9)

`allow_imports_by_path` maps glob patterns to arrays of packages that are
allowed **despite** appearing in `forbidden_imports`. Example:

```yaml
boundary_rules:
  forbidden_imports: ['fastify', 'drizzle-orm']
  allow_imports_by_path:
    'src/infra/routes/**': ['fastify'] # routes MAY import fastify
    'src/infra/repositories/**': ['drizzle-orm'] # repos MAY import drizzle
```

A file at `src/infra/routes/journal-routes.ts` importing `fastify` passes E8
because it matches the exception glob.

### Cross-Layer Imports (E10)

`forbid_cross_layer_imports` enforces intra-package layer isolation:

```yaml
forbid_cross_layer_imports:
  - { from: 'src/domain/**', forbid: ['src/app/**', 'src/infra/**'] }
  - { from: 'src/app/**', forbid: ['src/infra/**'] }
```

A file at `src/domain/entities/journal.ts` importing
`../app/services/post-journal` triggers E10.

### Circular Dependency Detection (E13)

E13 runs **once globally** (not per-package). It builds a directed graph from
all `package.json` `dependencies` where the dep starts with `@afenda/`, then
runs DFS cycle detection. Any cycle (e.g. `@afenda/a → @afenda/b → @afenda/a`)
is a **FAIL**. This prevents initialization-order bugs and broken tree-shaking.

### Public API Surface Stability (E14)

For packages that declare `public_api` in their frontmatter (e.g.
`"src/public.ts"`), E14 verifies:

1. The file exists on disk
2. It contains at least one exported symbol (parsed via regex for
   `export { ... } from`, `export function`, `export class`, `export const`,
   `export type`, `export interface`, `export enum`)

The check logs the export count as a pass message, providing a baseline for API
surface tracking.

### Port-Implementation Parity (E15)

For packages with hexagonal architecture (both `ports` and `repositories` in
`required_directories`), E15 scans:

1. All `export interface I*Repo`, `I*Store`, `I*Writer`, `I*Generator`,
   `I*Policy` declarations in `src/app/ports/`
2. All `implements I*` clauses in `.ts` files under `src/infra/` subdirectories
   (excluding `routes/` and `mappers/`)

A port without a matching implementation is a **WARN** (not FAIL), since some
ports may be implemented by external packages or test mocks.

### Slice Isolation (E16)

For packages with `slice_isolation: true` in frontmatter, E16 enforces that
files inside `src/slices/<slug>/` **never** import directly from another slice
via relative paths such as `../../<other>/` or `../../../slices/<other>/`.
Cross-slice coupling must go through the `src/shared/` mediation layer.

**Allowed:**

- Imports within the same slice (`./` or `../` staying within
  `src/slices/<slug>/`)
- Imports from `../../../shared/` or deeper shared sub-paths

**Forbidden:**

- `../../<other-slug>/...` (direct peer-slice import)
- `../../../slices/<other-slug>/...` (absolute-style cross-slice import)

---

## §F. CLI Interface

```bash
# Validate all packages
pnpm arch:guard

# Validate a single package
pnpm arch:guard --pkg @afenda/finance

# Auto-fix (create missing directories)
pnpm arch:guard --fix

# JSON output for CI
pnpm arch:guard --json
```

**Exit codes:**

- `0` — all checks pass
- `1` — one or more FAIL checks
- `2` — fatal error (missing manifest, parse error)

**CI pipeline order:**

```
arch:guard → typecheck → lint → test → build
```

`arch:guard` runs first because it validates structural invariants that later
steps depend on.

---

## §G. Vibe-Coding Contract

When an AI agent or developer modifies a package, they MUST:

1. **Read** the package's `ARCHITECTURE.*.md` frontmatter BEFORE writing code
2. **Only import** from packages listed in `allowed_import_prefixes`
3. **Never import** from `forbidden_imports` unless the source file matches an
   `allow_imports_by_path` glob
4. **Respect** `forbid_cross_layer_imports` — domain is pure, app doesn't touch
   infra
5. **Only add** dependencies that appear in `allowed_runtime` or `allowed_dev`;
   update the frontmatter if a new dep is genuinely needed
6. **Update** the `## Exports` section when adding new public API surface
7. **Run** `pnpm arch:guard --pkg @afenda/<name>` after changes to verify
   compliance

### Adding a New Dependency

If a package needs a dependency not in its allowlist:

1. Verify the dependency is appropriate for the package's layer (see §B)
2. Add it to the `dependency_kinds.allowed_runtime` (or `allowed_dev`) in the
   frontmatter
3. Add it to `boundary_rules.allowed_import_prefixes` if source files will
   import it
4. Run `pnpm arch:guard` to verify no other packages are affected
5. Commit the frontmatter change alongside the code change

---

## §H. Generator Integration

`pnpm gen:module <name>` generates an `ARCHITECTURE.*.md` with the full
frontmatter schema pre-filled for the `module` layer. The generated frontmatter
includes:

- Standard module dependency allowlist (core, contracts, authz, db, platform)
- Required domain/app/infra directory structure
- Cross-layer import rules (domain → app → infra)
- Path-scoped exceptions for infra adapters

Generators for other package types (`gen:table`, `gen:endpoint`) do not create
ARCHITECTURE.md files — they modify existing packages.

---

## §I. Relationship to Other Governance

| Document                        | Scope                                               | Enforced By             |
| ------------------------------- | --------------------------------------------------- | ----------------------- |
| `PROJECT.md`                    | Monorepo-wide architecture, conventions, tech stack | `agents-drift.mjs`      |
| `ARCHITECTURE.*.md` (this spec) | Per-package boundaries, deps, structure             | `arch-guard.mjs`        |
| `.afenda/project.manifest.json` | Package registry (name, type, layer)                | `drift-check/index.mjs` |
| `.agents/skills-registry.json`  | AI agent skill catalog                              | `agents-gen.mjs`        |

`PROJECT.md` defines the **what** and **why**. `ARCHITECTURE.*.md` defines the
**how** per package. The manifest is the registry. The drift tools enforce all
three.

---

_Ratified: 2026-02-22 — v1.0_  
_Updated: 2026-02-23 — v1.2 (E13 circular deps, E14 public API surface, E15
port-impl parity, E16 slice isolation, CIG-03 unsafe casts)_ _Updated:
2026-02-24 — v1.2 (CIG-04 no DB imports in routes/handlers/pages, enforced in
@afenda/eslint-config)_ _Updated: 2026-02-24 — v1.3 (ERP benchmarking: evidence
schema, property-based invariant tests, AIS 41-item audit with evidence levels,
SOX ITGC 12-control audit, evidence pack generator)_
