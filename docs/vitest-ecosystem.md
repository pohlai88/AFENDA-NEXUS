# Vitest in this monorepo

## Layout

- **Root** `vitest.config.ts` — defines the workspace: one Vitest run loads all projects. The root `package.json` must list `vitest` in `devDependencies` (e.g. `"vitest": "catalog:"`) so the config can load (CLI and VS Code extension).
- **Per-package** `vitest.config.ts` — each app/package has its own config (environment, include, coverage). Root config references them via `test.projects`.
- **Shared** `vitest.shared.ts` — optional shared `test` options; some packages extend it.

## Commands

```bash
# From repo root: run all workspace tests (single Vitest process, all projects)
pnpm test:vitest
# or
pnpm exec vitest run

# Run a single project
pnpm exec vitest run --project @afenda/web

# Per-package (uses that package's config only)
pnpm --filter @afenda/web test
pnpm --filter @afenda/core test
```

## VS Code extension

The [Vitest extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) is configured in `.vscode/settings.json`:

- **`vitest.rootConfig`**: `"vitest.config.ts"` — use the root config as the single source of truth.
- **`vitest.maximumConfigs`**: `15` — allow enough configs for all workspace projects.

If you see **"The extension could not load some configs"**:

1. Ensure the **root** `package.json` has `vitest` in `devDependencies` (e.g. `"vitest": "catalog:"`).
2. Run `pnpm install` from the repo root.
3. Reload the VS Code window (or restart VS Code).

The extension runs Vitest from the workspace root; if `vitest` isn't installed at the root, the root config fails to load and the extension reports the error.

## Agent skill

The Vitest agent skill is from the official store: **antfu/skills@vitest** (see `.agents/skills/vitest` and `.agents/skills/INSTALLED-SKILLS.md`). It covers config, CLI, mocking, coverage, snapshots, and type testing.

To update the skill:

```bash
npx skills add antfu/skills@vitest -g -y
```

(Then copy/refresh into `.agents/skills/vitest` if your workflow keeps skills in-repo.)
