#!/usr/bin/env node
/**
 * gen:module <name> — Scaffold a new domain module under packages/modules/.
 *
 * Creates: domain/app/infra layers, public.ts, package.json, tsconfig, tsup, eslint, ARCHITECTURE.md
 * Updates: .afenda/project.manifest.json, root tsconfig.json references
 *
 * Usage: pnpm gen:module inventory
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm gen:module <name>");
  process.exit(1);
}

const root = process.cwd();
const dir = join(root, "packages", "modules", name);
const pkg = `@afenda/${name}`;

console.log(`Generating module: ${pkg} at ${dir}`);

// Create directory structure
const dirs = [
  join(dir, "src", "domain", "entities"),
  join(dir, "src", "app", "ports"),
  join(dir, "src", "app", "services"),
  join(dir, "src", "infra", "repositories"),
  join(dir, "src", "infra", "routes"),
];
for (const d of dirs) mkdirSync(d, { recursive: true });

// package.json
writeFileSync(
  join(dir, "package.json"),
  JSON.stringify(
    {
      name: pkg,
      version: "0.0.0",
      private: true,
      type: "module",
      main: "./src/public.ts",
      types: "./src/public.ts",
      exports: {
        ".": {
          import: "./dist/public.js",
          types: "./dist/public.d.ts",
          default: "./src/public.ts",
        },
      },
      files: ["dist", `ARCHITECTURE.${pkg.replace("/", "-")}.md`],
      sideEffects: false,
      scripts: {
        build: "tsup && tsc -p tsconfig.build.json --emitDeclarationOnly",
        dev: "tsup --watch",
        typecheck: "tsc --noEmit",
        lint: "eslint src/",
      },
      dependencies: {
        "@afenda/core": "workspace:*",
        "@afenda/contracts": "workspace:*",
        "@afenda/db": "workspace:*",
        "@afenda/platform": "workspace:*",
      },
      devDependencies: {
        "@afenda/typescript-config": "workspace:*",
        "@afenda/eslint-config": "workspace:*",
        tsup: "catalog:",
        typescript: "catalog:",
      },
    },
    null,
    2,
  ) + "\n",
);

// tsconfig.json
writeFileSync(
  join(dir, "tsconfig.json"),
  JSON.stringify(
    {
      extends: "@afenda/typescript-config/library.json",
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: true,
        outDir: "./dist",
        noEmit: false,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist", "**/*.test.*", "**/*.spec.*"],
    },
    null,
    2,
  ) + "\n",
);

// tsconfig.build.json
writeFileSync(
  join(dir, "tsconfig.build.json"),
  JSON.stringify(
    {
      extends: "./tsconfig.json",
      compilerOptions: { composite: false, incremental: false, tsBuildInfoFile: null },
    },
    null,
    2,
  ) + "\n",
);

// tsup.config.ts
writeFileSync(
  join(dir, "tsup.config.ts"),
  `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/public.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.build.json",
  external: ["@afenda/core", "@afenda/contracts", "@afenda/db", "@afenda/platform"],
});
`,
);

// eslint.config.js
writeFileSync(
  join(dir, "eslint.config.js"),
  `import baseConfig from "@afenda/eslint-config";

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
`,
);

// domain/index.ts
writeFileSync(join(dir, "src", "domain", "index.ts"), `// Domain exports for ${name}\n`);

// app/index.ts
writeFileSync(join(dir, "src", "app", "index.ts"), `// Application layer exports for ${name}\n`);

// infra/index.ts
writeFileSync(join(dir, "src", "infra", "index.ts"), `// Infrastructure layer exports for ${name}\n`);

// public.ts
writeFileSync(
  join(dir, "src", "public.ts"),
  `/**
 * ${pkg} — Public API surface.
 *
 * This is the ONLY entrypoint consumers should import from.
 */

// Domain types
export * from "./domain/index.js";

// App layer
export * from "./app/index.js";

// Infra adapters
export * from "./infra/index.js";
`,
);

// ARCHITECTURE.md (full frontmatter schema per docs/ARCHITECTURE-SPEC.md)
const archName = pkg.replace("/", "-");
writeFileSync(
  join(dir, `ARCHITECTURE.${archName}.md`),
  `---
package: "${pkg}"
root_dir: "packages/modules/${name}"
type: library
layer: module
composite: true
entrypoints: ["src/public.ts"]
public_api: "src/public.ts"
exports_map:
  ".": { import: "./dist/public.js", types: "./dist/public.d.ts" }
dependency_kinds:
  allowed_runtime: ["@afenda/core", "@afenda/contracts", "@afenda/authz", "@afenda/db", "@afenda/platform"]
  allowed_dev: ["@afenda/typescript-config", "@afenda/eslint-config", "tsup", "typescript"]
  allowed_peer: []
enforced_structure:
  required_files: ["src/public.ts", "package.json", "tsconfig.json", "tsconfig.build.json", "tsup.config.ts"]
  required_directories: ["src/domain", "src/domain/entities", "src/app", "src/app/ports", "src/app/services", "src/infra", "src/infra/repositories", "src/infra/routes"]
boundary_rules:
  allowed_import_prefixes: ["./", "@afenda/core", "@afenda/contracts", "@afenda/authz", "@afenda/db", "@afenda/platform"]
  forbidden_imports: ["fastify", "drizzle-orm", "postgres"]
  allow_imports_by_path:
    "src/infra/routes/**": ["fastify"]
    "src/infra/repositories/**": ["drizzle-orm", "@afenda/db", "postgres"]
  forbid_cross_layer_imports:
    - { "from": "src/domain/**", "forbid": ["src/app/**", "src/infra/**"] }
    - { "from": "src/app/**", "forbid": ["src/infra/**"] }
---

# ${pkg}

## Purpose
Domain module for **${name}** functionality.

## Layer Rules
- **domain/** — Pure business rules. No DB, no HTTP, no framework imports.
- **app/** — Use-cases and ports (interfaces). Imports domain only.
- **infra/** — Adapters. Repositories use drizzle-orm; routes use fastify.
- **public.ts** — The ONLY entrypoint consumers import from.

## Exports
- *(Add exports as they are created)*
`,
);

// Update manifest
try {
  const manifestPath = join(root, ".afenda", "project.manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  manifest.packages[`packages/modules/${name}`] = {
    name: pkg,
    type: "library",
    layer: "module",
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Updated .afenda/project.manifest.json`);
} catch {
  console.warn("Could not update manifest — update manually.");
}

// Update root tsconfig references
try {
  const tsconfigPath = join(root, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
  const ref = `./packages/modules/${name}`;
  if (!tsconfig.references.some((r) => r.path === ref)) {
    tsconfig.references.push({ path: ref });
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
    console.log(`Updated root tsconfig.json references`);
  }
} catch {
  console.warn("Could not update root tsconfig — update manually.");
}

console.log(`✅ Module ${pkg} scaffolded. Run \`pnpm install\` to resolve deps.`);
