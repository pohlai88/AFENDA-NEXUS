#!/usr/bin/env node
/**
 * arch-guard.mjs — Per-package ARCHITECTURE.md governance enforcer.
 *
 * Reads YAML frontmatter from each package's ARCHITECTURE.*.md and validates
 * the actual codebase against it. See docs/ARCHITECTURE-SPEC.md for the full spec.
 *
 * Checks (§E of the spec):
 *   E1  ARCHITECTURE.md exists for every manifest package
 *   E2  package field matches package.json name
 *   E3  root_dir matches actual location
 *   E4  required_files exist on disk
 *   E5  required_directories exist on disk
 *   E6  dependencies ⊆ allowed_runtime
 *   E7  devDependencies ⊆ allowed_dev
 *   E8  No source file imports forbidden_imports
 *   E9  Path-scoped exceptions override E8
 *   E10 Cross-layer imports respected
 *   E11 tsconfig.json composite matches frontmatter
 *   E12 package.json exports matches exports_map
 *   E13 No circular package dependencies (global)
 *   E14 Public API surface stability (exports in public_api file)
 *   E15 Port-implementation parity (every I*Repo port has a Drizzle* impl)
 *   E16 Slice isolation (no direct cross-slice imports; must go through shared/)
 *
 * Usage:
 *   node tools/drift-check/src/arch-guard.mjs
 *   node tools/drift-check/src/arch-guard.mjs --pkg @afenda/finance
 *   node tools/drift-check/src/arch-guard.mjs --fix
 *   node tools/drift-check/src/arch-guard.mjs --json
 *
 * Exit codes: 0 = pass, 1 = failures, 2 = fatal
 * Zero dependencies — uses only Node.js built-ins.
 */

import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");
const MANIFEST_PATH = join(REPO_ROOT, ".afenda", "project.manifest.json");

const PKG_FILTER = (() => {
  const idx = process.argv.indexOf("--pkg");
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
})();
const FIX_MODE = process.argv.includes("--fix");
const JSON_MODE = process.argv.includes("--json");

// ─── Result Accumulator ─────────────────────────────────────────────────────

const results = { pass: [], fail: [], warn: [] };

function pass(pkg, check, msg) {
  results.pass.push({ pkg, check, msg });
}
function fail(pkg, check, msg) {
  results.fail.push({ pkg, check, msg });
}
function warn(pkg, check, msg) {
  results.warn.push({ pkg, check, msg });
}

// ─── YAML Frontmatter Parser (minimal, zero-dep) ───────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const raw = match[1];
  const fm = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = null;
  let currentObj = fm;
  // stack entries: { obj, indent }
  const stack = [{ obj: fm, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Pop stack when dedenting — ensures we attach to the correct parent
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    currentObj = stack[stack.length - 1].obj;

    // Array item
    if (trimmed.startsWith("- ")) {
      const val = trimmed.slice(2).trim();

      // Resolve the owner of currentKey — it may be the current stack frame or
      // a parent frame (when the parser pushed an empty {} for a block-list key
      // like `allowed_runtime:` and we are now inside that empty object).
      let listOwner = currentObj;
      if (currentKey && !(currentKey in currentObj)) {
        // Walk up the stack to find the object that actually owns currentKey
        for (let i = stack.length - 2; i >= 0; i--) {
          if (currentKey in stack[i].obj) {
            listOwner = stack[i].obj;
            break;
          }
        }
      }

      // Promote empty object to array when first list item arrives
      if (currentKey && typeof listOwner[currentKey] === "object" && !Array.isArray(listOwner[currentKey]) && Object.keys(listOwner[currentKey]).length === 0) {
        listOwner[currentKey] = [];
      }
      if (currentKey && Array.isArray(listOwner[currentKey])) {
        // Parse inline object { from: "x", forbid: ["y"] }
        if (val.startsWith("{")) {
          try {
            // YAML allows unquoted keys — quote them for JSON.parse
            const jsonified = val.replace(/'/g, '"').replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1 "$2":');
            listOwner[currentKey].push(JSON.parse(jsonified));
          } catch {
            listOwner[currentKey].push(val);
          }
        } else {
          listOwner[currentKey].push(parseValue(val));
        }
      }
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    let key = trimmed.slice(0, colonIdx).trim();
    // Strip surrounding quotes from YAML map keys
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }
    let value = trimmed.slice(colonIdx + 1).trim();

    // Remove inline comments
    if (value.includes("#") && !value.startsWith('"') && !value.startsWith("'") && !value.startsWith("[") && !value.startsWith("{")) {
      value = value.split("#")[0].trim();
    }

    if (value === "" || value === "|") {
      // Nested object or upcoming array
      currentObj[key] = {};
      stack.push({ obj: currentObj[key], indent });
      currentObj = currentObj[key];
      currentKey = key;
    } else {
      const parsed = parseValue(value);
      currentObj[key] = parsed;
      currentKey = key;
    }
  }

  return fm;
}

function parseValue(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null") return null;
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  // Inline array: ["a", "b"]
  if (val.startsWith("[")) {
    try {
      return JSON.parse(val.replace(/'/g, '"'));
    } catch {
      return val;
    }
  }
  // Inline object: { import: "./dist/index.js", types: "./dist/index.d.ts" }
  if (val.startsWith("{")) {
    try {
      // YAML allows unquoted keys — quote them for JSON.parse
      const jsonified = val.replace(/'/g, '"').replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1 "$2":');
      return JSON.parse(jsonified);
    } catch {
      return val;
    }
  }
  return val;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Safely coerce a parsed YAML value to an array (handles objects from block-list parse) */
function toArray(val) {
  if (Array.isArray(val)) return val;
  return [];
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function findArchFile(pkgDir) {
  if (!existsSync(pkgDir)) return null;
  const files = readdirSync(pkgDir).filter((f) => f.startsWith("ARCHITECTURE.") && f.endsWith(".md"));
  return files.length > 0 ? join(pkgDir, files[0]) : null;
}

function collectSourceFiles(dir, collected = []) {
  if (!existsSync(dir)) return collected;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".next", "build", ".turbo"].includes(entry.name)) continue;
      collectSourceFiles(full, collected);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) continue;
      collected.push(full);
    }
  }
  return collected;
}

function extractImports(content) {
  const imports = [];
  // ESM: import ... from "pkg" / import ... from 'pkg'
  const esmRegex = /(?:import|export)\s+.*?\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = esmRegex.exec(content)) !== null) imports.push(m[1]);
  // ESM: import "pkg" (side-effect)
  const sideEffectRegex = /import\s+["']([^"']+)["']/g;
  while ((m = sideEffectRegex.exec(content)) !== null) imports.push(m[1]);
  // Dynamic: import("pkg")
  const dynamicRegex = /import\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRegex.exec(content)) !== null) imports.push(m[1]);
  // CJS: require("pkg")
  const cjsRegex = /require\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = cjsRegex.exec(content)) !== null) imports.push(m[1]);
  return [...new Set(imports)];
}

function getPackageFromImport(imp) {
  if (imp.startsWith(".") || imp.startsWith("/")) return null; // relative
  if (imp.startsWith("node:")) return null; // built-in
  // Scoped: @scope/name or @scope/name/path
  if (imp.startsWith("@")) {
    const parts = imp.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : imp;
  }
  // Unscoped: name or name/path
  return imp.split("/")[0];
}

function matchesGlob(filePath, pattern) {
  // Glob matching: supports *, ** wildcards in any position.
  // * matches a single path segment, ** matches zero or more segments.
  const normalized = filePath.replace(/\\/g, "/");
  const patParts = pattern.split("/");
  const fileParts = normalized.split("/");

  function match(pi, fi) {
    if (pi === patParts.length && fi === fileParts.length) return true;
    if (pi === patParts.length) return false;
    const seg = patParts[pi];
    if (seg === "**") {
      // ** matches zero or more path segments
      if (pi === patParts.length - 1) return true; // trailing **
      for (let skip = fi; skip <= fileParts.length; skip++) {
        if (match(pi + 1, skip)) return true;
      }
      return false;
    }
    if (fi === fileParts.length) return false;
    if (seg === "*") return match(pi + 1, fi + 1); // * matches exactly one segment
    return seg === fileParts[fi] && match(pi + 1, fi + 1);
  }
  return match(0, 0);
}

function isRelativeImportCrossLayer(imp, sourceRelPath, rules) {
  if (!imp.startsWith("./") && !imp.startsWith("../")) return false;
  if (!rules || rules.length === 0) return false;

  // Resolve the import target relative to the source file
  const sourceDir = dirname(sourceRelPath).replace(/\\/g, "/");
  // Normalize: join sourceDir + imp, remove ./ and resolve ../
  let target = posix.normalize(posix.join(sourceDir, imp));
  // Add .ts extension heuristic for matching
  if (!target.includes(".")) target += ".ts";

  const normalizedSource = sourceRelPath.replace(/\\/g, "/");

  for (const rule of rules) {
    const fromPattern = rule.from;
    const forbidPatterns = rule.forbid;
    if (!matchesGlob(normalizedSource, fromPattern)) continue;
    for (const forbidPattern of forbidPatterns) {
      if (matchesGlob(target, forbidPattern)) {
        return { from: fromPattern, forbid: forbidPattern, source: normalizedSource, target };
      }
    }
  }
  return false;
}

// ─── Checks ─────────────────────────────────────────────────────────────────

function checkPackage(pkgPath, manifestEntry) {
  const pkgDir = join(REPO_ROOT, pkgPath);
  const pkgName = manifestEntry.name;

  // Skip unmanaged packages
  if (manifestEntry.type === "unmanaged") return;

  // E1: ARCHITECTURE.md exists
  const archFile = findArchFile(pkgDir);
  if (!archFile) {
    fail(pkgName, "E1", `ARCHITECTURE.*.md missing in ${pkgPath}`);
    return; // Can't check further without frontmatter
  }
  pass(pkgName, "E1", "ARCHITECTURE.md exists");

  // Parse frontmatter
  const content = readFileSync(archFile, "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm) {
    fail(pkgName, "E1", `ARCHITECTURE.md has no valid YAML frontmatter in ${pkgPath}`);
    return;
  }

  // E2: package matches package.json name
  const pkgJson = loadJson(join(pkgDir, "package.json"));
  if (pkgJson) {
    if (fm.package === pkgJson.name) {
      pass(pkgName, "E2", `package field matches package.json name`);
    } else {
      fail(pkgName, "E2", `package "${fm.package}" != package.json name "${pkgJson.name}"`);
    }
  }

  // E3: root_dir matches
  if (fm.root_dir === pkgPath) {
    pass(pkgName, "E3", `root_dir matches`);
  } else {
    fail(pkgName, "E3", `root_dir "${fm.root_dir}" != manifest path "${pkgPath}"`);
  }

  // E4: required_files
  const requiredFilesRaw = fm.enforced_structure?.required_files;
  const requiredFiles = Array.isArray(requiredFilesRaw) ? requiredFilesRaw : [];
  for (const f of requiredFiles) {
    const filePath = join(pkgDir, f);
    if (existsSync(filePath)) {
      pass(pkgName, "E4", `Required file "${f}" exists`);
    } else {
      fail(pkgName, "E4", `Required file "${f}" missing`);
    }
  }

  // E5: required_directories
  const requiredDirsRaw = fm.enforced_structure?.required_directories;
  const requiredDirs = Array.isArray(requiredDirsRaw) ? requiredDirsRaw : [];
  for (const d of requiredDirs) {
    const dirPath = join(pkgDir, d);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      pass(pkgName, "E5", `Required directory "${d}" exists`);
    } else if (FIX_MODE) {
      mkdirSync(dirPath, { recursive: true });
      pass(pkgName, "E5", `Required directory "${d}" created (--fix)`);
    } else {
      fail(pkgName, "E5", `Required directory "${d}" missing`);
    }
  }

  // E6: dependencies ⊆ allowed_runtime
  const allowedRuntime = toArray(fm.dependency_kinds?.allowed_runtime);
  const deps = pkgJson?.dependencies || {};
  for (const dep of Object.keys(deps)) {
    if (deps[dep] === "workspace:*" || deps[dep]?.startsWith("workspace:")) continue; // workspace deps always OK
    if (allowedRuntime.includes(dep)) {
      pass(pkgName, "E6", `Dep "${dep}" is in allowed_runtime`);
    } else {
      fail(pkgName, "E6", `Dep "${dep}" NOT in allowed_runtime -- add to ARCHITECTURE.md or remove`);
    }
  }

  // E7: devDependencies ⊆ allowed_dev
  const allowedDev = toArray(fm.dependency_kinds?.allowed_dev);
  const devDeps = pkgJson?.devDependencies || {};
  for (const dep of Object.keys(devDeps)) {
    if (devDeps[dep] === "workspace:*" || devDeps[dep]?.startsWith("workspace:")) continue;
    if (allowedDev.includes(dep)) {
      pass(pkgName, "E7", `DevDep "${dep}" is in allowed_dev`);
    } else {
      fail(pkgName, "E7", `DevDep "${dep}" NOT in allowed_dev -- add to ARCHITECTURE.md or remove`);
    }
  }

  // E8/E9/E10: Import boundary checks
  const forbiddenImports = toArray(fm.boundary_rules?.forbidden_imports);
  const allowByPath = fm.boundary_rules?.allow_imports_by_path || {};
  const crossLayerRules = toArray(fm.boundary_rules?.forbid_cross_layer_imports);

  if (forbiddenImports.length > 0 || crossLayerRules.length > 0) {
    const sourceFiles = collectSourceFiles(join(pkgDir, "src"));
    for (const sourceFile of sourceFiles) {
      const fileContent = readFileSync(sourceFile, "utf-8");
      const imports = extractImports(fileContent);
      const relPath = relative(pkgDir, sourceFile);

      for (const imp of imports) {
        const pkg = getPackageFromImport(imp);

        // E8: Forbidden imports
        if (pkg && forbiddenImports.some((f) => pkg === f || pkg.startsWith(f + "/"))) {
          // E9: Check path-scoped exceptions
          let excepted = false;
          for (const [globPattern, allowedPkgs] of Object.entries(allowByPath)) {
            if (matchesGlob(relPath.replace(/\\/g, "/"), globPattern) && allowedPkgs.includes(pkg)) {
              excepted = true;
              break;
            }
          }
          if (excepted) {
            pass(pkgName, "E9", `"${pkg}" allowed in ${relPath} (path exception)`);
          } else {
            fail(pkgName, "E8", `"${relPath}" imports forbidden "${pkg}"`);
          }
        }

        // E10: Cross-layer imports (relative imports only)
        if (imp.startsWith(".") && crossLayerRules.length > 0) {
          const violation = isRelativeImportCrossLayer(imp, relPath, crossLayerRules);
          if (violation) {
            fail(pkgName, "E10", `Cross-layer: "${violation.source}" imports "${violation.target}" (${violation.from} -> ${violation.forbid})`);
          }
        }
      }
    }
  }

  // E11: composite flag
  const tsconfig = loadJson(join(pkgDir, "tsconfig.json"));
  if (tsconfig && fm.composite !== undefined) {
    const actual = tsconfig.compilerOptions?.composite ?? false;
    if (actual === fm.composite) {
      pass(pkgName, "E11", `composite=${fm.composite} matches tsconfig`);
    } else {
      warn(pkgName, "E11", `composite: frontmatter=${fm.composite}, tsconfig=${actual}`);
    }
  }

  // E12: exports_map
  if (fm.exports_map && fm.exports_map !== "null" && pkgJson?.exports) {
    // Simple string comparison of the "." export
    const fmDot = fm.exports_map["."];
    const pkgDot = pkgJson.exports["."];
    if (fmDot && pkgDot) {
      const fmStr = typeof fmDot === "string" ? fmDot : JSON.stringify(fmDot);
      const pkgStr = typeof pkgDot === "string" ? pkgDot : JSON.stringify(pkgDot);
      if (fmStr === pkgStr) {
        pass(pkgName, "E12", `exports["."] matches`);
      } else {
        warn(pkgName, "E12", `exports["."] mismatch: frontmatter=${fmStr}, package.json=${pkgStr}`);
      }
    }
  }
}

// ─── E13: Circular Dependency Detection (global) ────────────────────────────

function checkCircularDeps(manifest) {
  // Build adjacency list from package.json dependencies
  const graph = new Map(); // pkgName → Set<pkgName>
  const pkgNames = new Set();

  for (const [pkgPath, entry] of Object.entries(manifest.packages)) {
    if (entry.type === "unmanaged") continue;
    pkgNames.add(entry.name);
    const pkgDir = join(REPO_ROOT, pkgPath);
    const pkgJson = loadJson(join(pkgDir, "package.json"));
    if (!pkgJson) continue;

    const edges = new Set();
    for (const dep of Object.keys(pkgJson.dependencies || {})) {
      if (dep.startsWith("@afenda/")) edges.add(dep);
    }
    graph.set(entry.name, edges);
  }

  // DFS cycle detection
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const name of pkgNames) color.set(name, WHITE);

  const cycles = [];

  function dfs(node, path) {
    color.set(node, GRAY);
    path.push(node);
    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!pkgNames.has(neighbor)) continue;
      if (color.get(neighbor) === GRAY) {
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart).concat(neighbor));
      } else if (color.get(neighbor) === WHITE) {
        dfs(neighbor, path);
      }
    }
    path.pop();
    color.set(node, BLACK);
  }

  for (const name of pkgNames) {
    if (color.get(name) === WHITE) dfs(name, []);
  }

  if (cycles.length === 0) {
    pass("*", "E13", "No circular package dependencies detected");
  } else {
    for (const cycle of cycles) {
      fail("*", "E13", `Circular dependency: ${cycle.join(" -> ")}`);
    }
  }
}

// ─── E14: Public API Surface Stability ──────────────────────────────────────

function checkPublicApiSurface(pkgPath, pkgName, fm) {
  const publicApiFile = fm.public_api;
  if (!publicApiFile) return; // No public_api declared — skip

  const pkgDir = join(REPO_ROOT, pkgPath);
  const apiPath = join(pkgDir, publicApiFile);
  if (!existsSync(apiPath)) {
    fail(pkgName, "E14", `public_api file "${publicApiFile}" does not exist`);
    return;
  }

  const content = readFileSync(apiPath, "utf-8");

  // Extract all named exports: export { X }, export type { X }, export { X } from "..."
  const exportedSymbols = new Set();
  // "export { A, B, C } from ..."
  const reExportRegex = /export\s+(?:type\s+)?{([^}]+)}\s+from/g;
  let m;
  while ((m = reExportRegex.exec(content)) !== null) {
    const names = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop().trim());
    for (const name of names) {
      if (name) exportedSymbols.add(name);
    }
  }
  // "export function X", "export class X", "export const X"
  const directExportRegex = /export\s+(?:async\s+)?(?:function|class|const|let|type|interface|enum)\s+(\w+)/g;
  while ((m = directExportRegex.exec(content)) !== null) {
    exportedSymbols.add(m[1]);
  }

  if (exportedSymbols.size === 0) {
    warn(pkgName, "E14", `No exports found in "${publicApiFile}" -- cannot verify API surface`);
    return;
  }

  pass(pkgName, "E14", `Public API surface: ${exportedSymbols.size} exports in "${publicApiFile}"`);
}

// ─── E15: Port-Implementation Parity ────────────────────────────────────────

function checkPortImplParity(pkgPath, pkgName, fm) {
  // Only check packages with hexagonal architecture (ports + repositories)
  const requiredDirs = toArray(fm.enforced_structure?.required_directories);
  const hasPorts = requiredDirs.some((d) => d.includes("ports"));
  const hasRepos = requiredDirs.some((d) => d.includes("repositories"));
  if (!hasPorts || !hasRepos) return;

  const pkgDir = join(REPO_ROOT, pkgPath);
  const portsDir = join(pkgDir, "src", "app", "ports");
  const reposDir = join(pkgDir, "src", "infra", "repositories");

  if (!existsSync(portsDir) || !existsSync(reposDir)) return;

  // Collect port interface names from port files
  const portFiles = readdirSync(portsDir).filter((f) => f.endsWith(".ts"));
  const portInterfaces = [];

  for (const file of portFiles) {
    const content = readFileSync(join(portsDir, file), "utf-8");
    const ifaceRegex = /export\s+interface\s+(I\w+(?:Repo|Store|Writer|Generator|Policy))/g;
    let m;
    while ((m = ifaceRegex.exec(content)) !== null) {
      portInterfaces.push({ name: m[1], file });
    }
  }

  if (portInterfaces.length === 0) return;

  // Collect implementation class names from infra subdirectories (repositories, authorization, etc.)
  const infraDir = join(pkgDir, "src", "infra");
  const infraSubdirs = existsSync(infraDir)
    ? readdirSync(infraDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "routes" && d.name !== "mappers")
      .map((d) => join(infraDir, d.name))
    : [reposDir];
  const implContent = infraSubdirs
    .filter((d) => existsSync(d))
    .flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".ts")).map((f) => readFileSync(join(d, f), "utf-8")))
    .join("\n");

  for (const port of portInterfaces) {
    // Check if any class implements this interface
    const implRegex = new RegExp(`implements\\s+[^{]*\\b${port.name}\\b`);
    if (implRegex.test(implContent)) {
      pass(pkgName, "E15", `Port "${port.name}" has implementation in infra/repositories`);
    } else {
      warn(pkgName, "E15", `Port "${port.name}" (${port.file}) has no implementation in infra/repositories`);
    }
  }
}

// ─── E16: Slice Isolation ────────────────────────────────────────────────────

/**
 * For packages declaring `slice_isolation: true` in ARCHITECTURE frontmatter,
 * ensures files inside `src/slices/<slug>/` never directly import from another
 * slice (`../../<other>/` or `../../../slices/<other>/`).
 *
 * Allowed cross-slice paths:
 *   - `../../../shared/` — shared types, ports, hooks
 *   - same-slice `../../../slices/<same>/` — intra-slice long-path
 *
 * The `shared/` folder is the mediation layer; all cross-slice communication
 * must be routed through shared port facades or hook files.
 */
function checkSliceIsolation(pkgPath, pkgName, fm) {
  if (!fm.slice_isolation) return;

  const pkgDir = join(REPO_ROOT, pkgPath);
  const slicesDir = join(pkgDir, "src", "slices");
  if (!existsSync(slicesDir)) {
    warn(pkgName, "E16", `slice_isolation=true but src/slices/ dir not found`);
    return;
  }

  // Discover slice slugs (top-level directories under src/slices/)
  const sliceSlugs = readdirSync(slicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const slugSet = new Set(sliceSlugs);
  let violations = 0;

  for (const slug of sliceSlugs) {
    const sliceDir = join(slicesDir, slug);
    const sourceFiles = collectSourceFiles(sliceDir);

    for (const sourceFile of sourceFiles) {
      const content = readFileSync(sourceFile, "utf-8");
      const imports = extractImports(content);
      const relToSlice = relative(sliceDir, sourceFile).replace(/\\/g, "/");

      for (const imp of imports) {
        if (!imp.startsWith(".")) continue; // skip bare/package imports

        // Normalize import path relative to the file
        const fileDir = dirname(relative(pkgDir, sourceFile)).replace(/\\/g, "/");
        const resolved = posix.normalize(posix.join(fileDir, imp));

        // Pattern 1: imports ../../<otherSlice>/ (short relative from calculators/services depth)
        const shortCross = imp.match(/^\.\.\/\.\.\/([a-z][a-z0-9-]*)\//);
        if (shortCross) {
          const targetSlug = shortCross[1];
          if (slugSet.has(targetSlug) && targetSlug !== slug) {
            fail(pkgName, "E16", `Slice "${slug}" imports from slice "${targetSlug}" in ${relToSlice} → ${imp} (use shared/ port instead)`);
            violations++;
            continue;
          }
        }

        // Pattern 2: imports ../../../slices/<otherSlice>/
        const longCross = imp.match(/slices\/([a-z][a-z0-9-]*)\//);
        if (longCross) {
          const targetSlug = longCross[1];
          if (slugSet.has(targetSlug) && targetSlug !== slug) {
            fail(pkgName, "E16", `Slice "${slug}" imports from slice "${targetSlug}" in ${relToSlice} → ${imp} (use shared/ port instead)`);
            violations++;
            continue;
          }
        }
      }
    }
  }

  if (violations === 0) {
    pass(pkgName, "E16", `Slice isolation: ${sliceSlugs.length} slices, 0 cross-slice violations`);
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

function printReport() {
  if (JSON_MODE) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log("\n+----------------------------------------------------------+");
  console.log("|            ARCHITECTURE Governance Report                |");
  console.log("+----------------------------------------------------------+\n");

  if (results.fail.length > 0) {
    console.log(`[FAIL] FAILURES (${results.fail.length}):\n`);
    for (const { pkg, check, msg } of results.fail) {
      console.log(`  [${check}] ${pkg}: ${msg}`);
    }
    console.log("");
  }

  if (results.warn.length > 0) {
    console.log(`[WARN] WARNINGS (${results.warn.length}):\n`);
    for (const { pkg, check, msg } of results.warn) {
      console.log(`  [${check}] ${pkg}: ${msg}`);
    }
    console.log("");
  }

  console.log(`[PASS] PASSED: ${results.pass.length}`);
  console.log(`[FAIL] FAILED: ${results.fail.length}`);
  console.log(`[WARN] WARNED: ${results.warn.length}`);
  console.log("");

  if (results.fail.length > 0) {
    console.log("=> Fix failures before merging. See docs/ARCHITECTURE-SPEC.md section E.\n");
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error("FATAL: .afenda/project.manifest.json not found");
    process.exit(2);
  }

  const manifest = loadJson(MANIFEST_PATH);
  if (!manifest || !manifest.packages) {
    console.error("FATAL: Invalid manifest");
    process.exit(2);
  }

  console.log("Running ARCHITECTURE governance checks...\n");

  for (const [pkgPath, entry] of Object.entries(manifest.packages)) {
    if (PKG_FILTER && entry.name !== PKG_FILTER) continue;
    checkPackage(pkgPath, entry);
  }

  // E13: Global circular dependency check (runs once across all packages)
  if (!PKG_FILTER) {
    checkCircularDeps(manifest);
  }

  // E14 + E15 + E16: Per-package checks that need frontmatter
  for (const [pkgPath, entry] of Object.entries(manifest.packages)) {
    if (entry.type === "unmanaged") continue;
    if (PKG_FILTER && entry.name !== PKG_FILTER) continue;
    const pkgDir = join(REPO_ROOT, pkgPath);
    const archFile = findArchFile(pkgDir);
    if (!archFile) continue;
    const content = readFileSync(archFile, "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm) continue;
    checkPublicApiSurface(pkgPath, entry.name, fm);
    checkPortImplParity(pkgPath, entry.name, fm);
    checkSliceIsolation(pkgPath, entry.name, fm);
  }

  printReport();
  process.exit(results.fail.length > 0 ? 1 : 0);
}

main();
