#!/usr/bin/env node
/**
 * dep-graph.mjs — Monorepo dependency graph generator & lineage analyser.
 *
 * Reads the project manifest and every package.json to build a full
 * dependency graph, then:
 *   1. Emits a Graphviz DOT file (always)
 *   2. Detects orphan / standalone / unreachable packages
 *   3. Detects broken lineage (missing deps, phantom refs, circular chains)
 *   4. Optionally renders SVG via the `dot` CLI
 *   5. Optionally outputs a structured JSON report
 *
 * Usage:
 *   node tools/graphviz/src/dep-graph.mjs                # DOT only
 *   node tools/graphviz/src/dep-graph.mjs --render        # DOT + SVG
 *   node tools/graphviz/src/dep-graph.mjs --json          # DOT + JSON report
 *   node tools/graphviz/src/dep-graph.mjs --orphans       # highlight orphans
 *   node tools/graphviz/src/dep-graph.mjs --lineage       # broken lineage check
 *   node tools/graphviz/src/dep-graph.mjs --pkg @afenda/finance  # single-package focus
 *   node tools/graphviz/src/dep-graph.mjs --imports       # file-level import graph
 *   node tools/graphviz/src/dep-graph.mjs --full          # all checks + render
 *   node tools/graphviz/src/dep-graph.mjs --fail          # exit 1 if issues found
 *
 * Exit codes: 0 = clean, 1 = issues found (with --fail), 2 = fatal error
 * Zero dependencies — uses only Node.js built-ins.
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// ─── Constants ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');
const MANIFEST_PATH = join(REPO_ROOT, '.afenda', 'project.manifest.json');
const OUT_DIR = join(REPO_ROOT, 'tools', 'graphviz', 'output');

// ─── CLI Flags ──────────────────────────────────────────────────────────────

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
dep-graph.mjs — Monorepo dependency graph & lineage analyser

Usage:
  node tools/graphviz/src/dep-graph.mjs [flags]

Flags:
  --orphans     Detect orphan / standalone packages
  --lineage     Detect phantom deps, cycles, layer violations, unreachable
  --imports     Scan file-level cross-package imports for undeclared deps
  --render      Render DOT → SVG/PNG via Graphviz dot CLI
  --json        Emit structured JSON report
  --diff <file> Compare against a previous JSON report (regression check)
  --pkg <name>  Focus on a single package and its neighbourhood
  --full        Enable all analyses + render + JSON
  --fail        Exit 1 if any issues found (for CI)
  --help, -h    Show this help

Examples:
  node tools/graphviz/src/dep-graph.mjs --full
  node tools/graphviz/src/dep-graph.mjs --pkg @afenda/finance --render
  node tools/graphviz/src/dep-graph.mjs --lineage --fail
  node tools/graphviz/src/dep-graph.mjs --diff tools/graphviz/output/dep-graph.json
`);
  process.exit(0);
}

const FLAGS = {
  render: process.argv.includes('--render'),
  json: process.argv.includes('--json'),
  orphans: process.argv.includes('--orphans') || process.argv.includes('--full'),
  lineage: process.argv.includes('--lineage') || process.argv.includes('--full'),
  imports: process.argv.includes('--imports') || process.argv.includes('--full'),
  full: process.argv.includes('--full'),
  fail: process.argv.includes('--fail'),
  diff: (() => {
    const idx = process.argv.indexOf('--diff');
    return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
  })(),
  pkg: (() => {
    const idx = process.argv.indexOf('--pkg');
    return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
  })(),
};

if (FLAGS.full) {
  FLAGS.render = true;
  FLAGS.json = true;
  FLAGS.orphans = true;
  FLAGS.lineage = true;
  FLAGS.imports = true;
}

// ─── Colour Palette ─────────────────────────────────────────────────────────

const COLORS = {
  app: '#2563eb',       // Blue-600
  library: '#16a34a',   // Green-600
  module: '#9333ea',    // Purple-600
  config: '#6b7280',    // Gray-500
  tool: '#ca8a04',      // Yellow-600
  unmanaged: '#9ca3af', // Gray-400
  orphan: '#ef4444',    // Red-500
  phantom: '#f97316',   // Orange-500
  edge: '#94a3b8',      // Slate-400
  edgeDev: '#d1d5db',   // Gray-300
};

const SHAPES = {
  app: 'house',
  library: 'box',
  module: 'component',
  config: 'note',
  tool: 'hexagon',
  unmanaged: 'plaintext',
};

/** Resolve shape: use layer to distinguish module-layer libraries from infra-layer. */
function resolveShape(node) {
  if (node.layer === 'module') return SHAPES.module;
  return SHAPES[node.type] ?? 'box';
}

// ─── Utility Helpers ────────────────────────────────────────────────────────

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function collectSourceFiles(dir, collected = []) {
  if (!existsSync(dir)) return collected;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'build', '.turbo', 'coverage'].includes(entry.name))
        continue;
      collectSourceFiles(full, collected);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

function extractImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const imports = new Set();

  // ESM: import ... from "..."
  const esmRegex = /(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = esmRegex.exec(content)) !== null) imports.add(m[1]);

  // Dynamic: import("...")
  const dynRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynRegex.exec(content)) !== null) imports.add(m[1]);

  // CJS: require("...")
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = cjsRegex.exec(content)) !== null) imports.add(m[1]);

  return imports;
}

// ─── Graph Builder ──────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   name: string;
 *   dir: string;
 *   type: string;
 *   layer: string | null;
 *   runtimeDeps: string[];
 *   devDeps: string[];
 *   allInternalDeps: string[];
 *   dependents: string[];
 * }} PackageNode
 */

function buildGraph() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('FATAL: .afenda/project.manifest.json not found');
    process.exit(2);
  }

  const manifest = loadJson(MANIFEST_PATH);
  if (!manifest?.packages) {
    console.error('FATAL: Invalid manifest');
    process.exit(2);
  }

  /** @type {Map<string, PackageNode>} keyed by @afenda/name */
  const nodes = new Map();

  // Build nodes from manifest + on-disk package.json
  for (const [relPath, meta] of Object.entries(manifest.packages)) {
    const absDir = resolve(REPO_ROOT, relPath);
    const pkgJson = loadJson(join(absDir, 'package.json'));
    const name = meta.name ?? pkgJson?.name ?? relPath;

    if (FLAGS.pkg && name !== FLAGS.pkg) continue;

    const runtimeDeps = Object.keys(pkgJson?.dependencies ?? {}).filter((d) =>
      d.startsWith('@afenda/')
    );
    const devDeps = Object.keys(pkgJson?.devDependencies ?? {}).filter((d) =>
      d.startsWith('@afenda/')
    );

    nodes.set(name, {
      name,
      dir: relPath,
      type: meta.type ?? 'unknown',
      layer: meta.layer ?? null,
      runtimeDeps,
      devDeps,
      allInternalDeps: [...new Set([...runtimeDeps, ...devDeps])],
      dependents: [], // filled below
    });
  }

  /** Helper: add a single node from the manifest by @afenda/ name. */
  function addNodeFromManifest(depName, mf, nodeMap) {
    const entry = Object.entries(mf.packages).find(([, m]) => m.name === depName);
    if (!entry) return;
    const absDir = resolve(REPO_ROOT, entry[0]);
    const pkgJson = loadJson(join(absDir, 'package.json'));
    const rDeps = Object.keys(pkgJson?.dependencies ?? {}).filter((d) => d.startsWith('@afenda/'));
    const dDeps = Object.keys(pkgJson?.devDependencies ?? {}).filter((d) => d.startsWith('@afenda/'));
    nodeMap.set(depName, {
      name: depName,
      dir: entry[0],
      type: entry[1].type ?? 'unknown',
      layer: entry[1].layer ?? null,
      runtimeDeps: rDeps,
      devDeps: dDeps,
      allInternalDeps: [...new Set([...rDeps, ...dDeps])],
      dependents: [],
    });
  }

  // If --pkg mode, re-add direct deps AND reverse dependents so focus subgraph has full neighbourhood
  if (FLAGS.pkg) {
    const target = nodes.get(FLAGS.pkg);
    if (target) {
      // Add downstream deps
      for (const dep of target.allInternalDeps) {
        if (!nodes.has(dep)) {
          addNodeFromManifest(dep, manifest, nodes);
        }
      }
      // Add upstream dependents (packages that depend on the target)
      for (const [relPath, meta] of Object.entries(manifest.packages)) {
        const name = meta.name ?? relPath;
        if (nodes.has(name)) continue;
        const absDir = resolve(REPO_ROOT, relPath);
        const pkgJson = loadJson(join(absDir, 'package.json'));
        const runtimeDeps = Object.keys(pkgJson?.dependencies ?? {}).filter((d) =>
          d.startsWith('@afenda/')
        );
        if (runtimeDeps.includes(FLAGS.pkg)) {
          const devDeps = Object.keys(pkgJson?.devDependencies ?? {}).filter((d) =>
            d.startsWith('@afenda/')
          );
          nodes.set(name, {
            name,
            dir: relPath,
            type: meta.type ?? 'unknown',
            layer: meta.layer ?? null,
            runtimeDeps,
            devDeps,
            allInternalDeps: [...new Set([...runtimeDeps, ...devDeps])],
            dependents: [],
          });
        }
      }
    }
  }

  // Resolve dependents (reverse edges)
  for (const [name, node] of nodes) {
    for (const dep of node.runtimeDeps) {
      const target = nodes.get(dep);
      if (target) target.dependents.push(name);
    }
  }

  return { nodes, manifest };
}

// ─── Analysis: Orphans & Standalone ─────────────────────────────────────────

/**
 * @typedef {{ orphans: string[]; standalone: string[]; noInbound: string[]; noOutbound: string[] }} OrphanReport
 */

function detectOrphans(nodes) {
  const configTypes = new Set(['config', 'unmanaged', 'tool']);
  /** @type {OrphanReport} */
  const report = { orphans: [], standalone: [], noInbound: [], noOutbound: [] };

  for (const [name, node] of nodes) {
    // Skip config/tool packages — they are allowed to be leaf nodes
    if (configTypes.has(node.type)) continue;

    const hasInbound = node.dependents.length > 0;
    const hasOutbound = node.runtimeDeps.length > 0;

    if (!hasInbound && !hasOutbound) {
      report.orphans.push(name);
    } else if (!hasInbound) {
      // Leaf consumers (apps are expected here — they consume but nobody depends on them)
      if (node.type !== 'app') {
        report.standalone.push(name);
      }
    }

    if (!hasInbound && node.type !== 'app') report.noInbound.push(name);
    if (!hasOutbound) report.noOutbound.push(name);
  }

  return report;
}

// ─── Analysis: Broken Lineage ───────────────────────────────────────────────

/**
 * @typedef {{
 *   phantomDeps: Array<{ from: string; to: string }>;
 *   cycles: string[][];
 *   layerViolations: Array<{ from: string; fromLayer: string; to: string; toLayer: string }>;
 *   unreachableFromApps: string[];
 * }} LineageReport
 */

function detectBrokenLineage(nodes) {
  /** @type {LineageReport} */
  const report = {
    phantomDeps: [],
    cycles: [],
    layerViolations: [],
    unreachableFromApps: [],
  };

  // 1. Phantom dependencies (declared but target doesn't exist in manifest)
  for (const [name, node] of nodes) {
    for (const dep of node.allInternalDeps) {
      if (!nodes.has(dep)) {
        report.phantomDeps.push({ from: name, to: dep });
      }
    }
  }

  // 2. Cycle detection (DFS-based, Tarjan-like)
  const visited = new Set();
  const inStack = new Set();
  const allCycles = [];

  function dfs(name, path) {
    if (inStack.has(name)) {
      const cycleStart = path.indexOf(name);
      allCycles.push(path.slice(cycleStart).concat(name));
      return;
    }
    if (visited.has(name)) return;
    visited.add(name);
    inStack.add(name);

    const node = nodes.get(name);
    if (node) {
      for (const dep of node.runtimeDeps) {
        dfs(dep, [...path, name]);
      }
    }

    inStack.delete(name);
  }

  for (const name of nodes.keys()) {
    dfs(name, []);
  }
  report.cycles = allCycles;

  // 3. Layer violations
  const LAYER_ORDER = [
    'domain-primitives', // 0 - lowest
    'contracts',         // 1
    'authorization',     // 2
    'infrastructure',    // 3
    'platform',          // 4
    'module',            // 5
    'app',               // 6 - highest
  ];
  const layerRank = Object.fromEntries(LAYER_ORDER.map((l, i) => [l, i]));

  for (const [name, node] of nodes) {
    if (!node.layer || !(node.layer in layerRank)) continue;
    const fromRank = layerRank[node.layer];

    for (const dep of node.runtimeDeps) {
      const target = nodes.get(dep);
      if (!target?.layer || !(target.layer in layerRank)) continue;
      const toRank = layerRank[target.layer];

      // Higher layer should not be imported by lower layer
      if (toRank > fromRank) {
        report.layerViolations.push({
          from: name,
          fromLayer: node.layer,
          to: dep,
          toLayer: target.layer,
        });
      }
    }
  }

  // 4. Unreachable from any app (library exists but no app can reach it)
  const reachable = new Set();

  function walk(name) {
    if (reachable.has(name)) return;
    reachable.add(name);
    const node = nodes.get(name);
    if (node) {
      for (const dep of node.runtimeDeps) walk(dep);
    }
  }

  for (const [name, node] of nodes) {
    if (node.type === 'app') walk(name);
  }

  const configTypes = new Set(['config', 'unmanaged', 'tool']);
  for (const [name, node] of nodes) {
    if (configTypes.has(node.type)) continue;
    if (node.type === 'app') continue;
    if (!reachable.has(name)) {
      report.unreachableFromApps.push(name);
    }
  }

  return report;
}

// ─── File-Level Import Analysis ─────────────────────────────────────────────

function buildFileImportGraph(nodes) {
  const edges = [];    // { from: file, to: target }
  const broken = [];   // { file, importSpec, reason }

  for (const [, node] of nodes) {
    // Skip tool packages — their source files often contain template literals
    // with @afenda/* import strings destined for generated code, not real imports.
    if (node.type === 'tool') continue;

    const absDir = resolve(REPO_ROOT, node.dir);
    const srcDir = join(absDir, 'src');
    if (!existsSync(srcDir)) continue;

    const files = collectSourceFiles(srcDir);
    for (const file of files) {
      const imports = extractImports(file);
      for (const spec of imports) {
        // Only check @afenda/ cross-package imports
        if (!spec.startsWith('@afenda/')) continue;
        const targetPkg = spec.replace(/^(@afenda\/[^/]+).*/, '$1');

        if (!nodes.has(targetPkg)) {
          broken.push({
            file: relative(REPO_ROOT, file),
            importSpec: spec,
            reason: `Package ${targetPkg} not in manifest`,
          });
          continue;
        }

        // Check if it's declared as a dependency
        if (
          !node.runtimeDeps.includes(targetPkg) &&
          !node.devDeps.includes(targetPkg)
        ) {
          broken.push({
            file: relative(REPO_ROOT, file),
            importSpec: spec,
            reason: `Import of ${targetPkg} not declared in package.json dependencies`,
          });
        }

        edges.push({
          from: relative(REPO_ROOT, file),
          to: targetPkg,
          fromPkg: node.name,
        });
      }
    }
  }

  return { edges, broken };
}

// ─── DOT Generation ─────────────────────────────────────────────────────────

function generateDot(nodes, orphanReport, lineageReport) {
  const lines = [];
  lines.push('digraph afenda_deps {');
  lines.push('  // Global settings');
  lines.push('  rankdir=TB;');
  lines.push('  fontname="Helvetica,Arial,sans-serif";');
  lines.push('  node [fontname="Helvetica,Arial,sans-serif" fontsize=11 style=filled];');
  lines.push('  edge [fontname="Helvetica,Arial,sans-serif" fontsize=9];');
  lines.push('  bgcolor="#fafafa";');
  lines.push('  label="@afenda Dependency Graph\\n(generated ' + new Date().toISOString().slice(0, 10) + ')";');
  lines.push('  labelloc=t;');
  lines.push('  fontsize=16;');
  lines.push('');

  // Group by layer using subgraphs
  const layerGroups = new Map();
  for (const [name, node] of nodes) {
    const layer = node.layer ?? 'other';
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer).push(node);
  }

  const LAYER_LABELS = {
    'app': 'Applications',
    'module': 'Domain Modules',
    'platform': 'Platform',
    'infrastructure': 'Infrastructure',
    'authorization': 'Authorization',
    'contracts': 'Contracts',
    'domain-primitives': 'Domain Primitives',
    'tool': 'Tooling',
    'other': 'Other',
  };

  const orphanSet = new Set([
    ...(orphanReport?.orphans ?? []),
    ...(orphanReport?.standalone ?? []),
  ]);
  const phantomSet = new Set(
    (lineageReport?.phantomDeps ?? []).map((p) => p.to)
  );
  const cycleNodes = new Set(
    (lineageReport?.cycles ?? []).flat()
  );
  const unreachableSet = new Set(lineageReport?.unreachableFromApps ?? []);

  // Rank ordering for layers (top to bottom)
  const layerOrder = [
    'app',
    'module',
    'platform',
    'infrastructure',
    'authorization',
    'contracts',
    'domain-primitives',
    'tool',
    'other',
  ];

  for (const layer of layerOrder) {
    const group = layerGroups.get(layer);
    if (!group || group.length === 0) continue;

    const label = LAYER_LABELS[layer] ?? layer;
    lines.push(`  subgraph cluster_${layer.replace(/[^a-zA-Z0-9]/g, '_')} {`);
    lines.push(`    label="${label}";`);
    lines.push(`    style=dashed;`);
    lines.push(`    color="#e2e8f0";`);
    lines.push(`    fontcolor="#64748b";`);
    lines.push('');

    for (const node of group) {
      const id = nodeId(node.name);
      const shape = resolveShape(node);
      let fillColor = node.layer === 'module' ? COLORS.module : (COLORS[node.type] ?? '#94a3b8');
      let penWidth = 1;
      let peripheries = 1;
      const extras = [];

      // Highlight problem nodes
      if (orphanSet.has(node.name)) {
        fillColor = COLORS.orphan;
        extras.push('⚠ ORPHAN');
        penWidth = 2;
      }
      if (unreachableSet.has(node.name)) {
        fillColor = COLORS.phantom;
        extras.push('⚠ UNREACHABLE');
        penWidth = 2;
      }
      if (cycleNodes.has(node.name)) {
        peripheries = 2;
        extras.push('⟳ CYCLE');
      }

      const tooltip = [
        `${node.name}`,
        `type: ${node.type}`,
        `layer: ${node.layer ?? 'none'}`,
        `deps: ${node.runtimeDeps.length}`,
        `dependents: ${node.dependents.length}`,
        ...extras,
      ].join('\\n');

      const displayName = node.name.replace('@afenda/', '');
      const labelText = extras.length > 0
        ? `${displayName}\\n${extras.join(' ')}`
        : displayName;

      lines.push(
        `    ${id} [label="${labelText}" shape=${shape} fillcolor="${fillColor}" ` +
        `fontcolor="white" penwidth=${penWidth} peripheries=${peripheries} ` +
        `tooltip="${tooltip}"];`
      );
    }
    lines.push('  }');
    lines.push('');
  }

  // Add phantom nodes (deps that don't exist in manifest)
  if (phantomSet.size > 0) {
    lines.push('  // Phantom dependencies (not in manifest)');
    for (const phantom of phantomSet) {
      const id = nodeId(phantom);
      const displayName = phantom.replace('@afenda/', '');
      lines.push(
        `  ${id} [label="${displayName}\\n⚠ PHANTOM" shape=box ` +
        `fillcolor="${COLORS.phantom}" fontcolor="white" style="filled,dashed" penwidth=2];`
      );
    }
    lines.push('');
  }

  // Edges
  const violationPairs = new Set(
    (lineageReport?.layerViolations ?? []).map((v) => `${v.from}|${v.to}`)
  );

  lines.push('  // Runtime dependencies');
  for (const [name, node] of nodes) {
    for (const dep of node.runtimeDeps) {
      // Skip if this edge is a layer violation — it will be drawn separately with a label
      if (violationPairs.has(`${name}|${dep}`)) continue;
      const color = cycleNodes.has(name) && cycleNodes.has(dep) ? '#ef4444' : COLORS.edge;
      const style = cycleNodes.has(name) && cycleNodes.has(dep) ? 'bold' : 'solid';
      lines.push(
        `  ${nodeId(name)} -> ${nodeId(dep)} [color="${color}" style=${style}];`
      );
    }
  }
  lines.push('');

  // Dev dependencies (lighter, dashed)
  lines.push('  // Dev dependencies');
  for (const [name, node] of nodes) {
    for (const dep of node.devDeps) {
      // Skip config packages to reduce noise
      if (dep === '@afenda/eslint-config' || dep === '@afenda/typescript-config') continue;
      lines.push(
        `  ${nodeId(name)} -> ${nodeId(dep)} [color="${COLORS.edgeDev}" style=dashed arrowsize=0.7];`
      );
    }
  }

  // Layer violation edges
  if (lineageReport?.layerViolations?.length > 0) {
    lines.push('');
    lines.push('  // Layer violations');
    for (const v of lineageReport.layerViolations) {
      lines.push(
        `  ${nodeId(v.from)} -> ${nodeId(v.to)} ` +
        `[color="#ef4444" style=bold penwidth=2 label="VIOLATION" fontcolor="#ef4444"];`
      );
    }
  }

  // Legend
  lines.push('');
  lines.push('  // Legend');
  lines.push('  subgraph cluster_legend {');
  lines.push('    label="Legend";');
  lines.push('    style=rounded;');
  lines.push('    color="#cbd5e1";');
  lines.push('    fontcolor="#475569";');
  lines.push('    node [fontsize=9 width=0.3 height=0.2];');
  lines.push(`    leg_app [label="App" shape=house fillcolor="${COLORS.app}" fontcolor="white"];`);
  lines.push(`    leg_lib [label="Library" shape=box fillcolor="${COLORS.library}" fontcolor="white"];`);
  lines.push(`    leg_mod [label="Module" shape=component fillcolor="${COLORS.module}" fontcolor="white"];`);
  lines.push(`    leg_cfg [label="Config" shape=note fillcolor="${COLORS.config}" fontcolor="white"];`);
  lines.push(`    leg_tool [label="Tool" shape=hexagon fillcolor="${COLORS.tool}" fontcolor="white"];`);
  lines.push(`    leg_orphan [label="Orphan" shape=box fillcolor="${COLORS.orphan}" fontcolor="white"];`);
  lines.push(`    leg_phantom [label="Phantom" shape=box fillcolor="${COLORS.phantom}" fontcolor="white" style="filled,dashed"];`);
  lines.push('    leg_app -> leg_lib -> leg_mod -> leg_cfg [style=invis];');
  lines.push('    leg_tool -> leg_orphan -> leg_phantom [style=invis];');
  lines.push('  }');

  lines.push('}');
  return lines.join('\n');
}

function nodeId(name) {
  return name.replace(/[@/\-]/g, '_');
}

// ─── Report Formatter ───────────────────────────────────────────────────────

function printConsoleReport(orphanReport, lineageReport, fileReport) {
  const SEP = '─'.repeat(60);
  console.log(`\n${SEP}`);
  console.log('  @afenda Dependency Graph — Analysis Report');
  console.log(`${SEP}\n`);

  let issueCount = 0;

  // Orphan analysis
  if (orphanReport) {
    console.log('▸ ORPHAN ANALYSIS');
    if (orphanReport.orphans.length > 0) {
      issueCount += orphanReport.orphans.length;
      console.log(`  ✗ ${orphanReport.orphans.length} orphan package(s) — no inbound or outbound deps:`);
      for (const o of orphanReport.orphans) console.log(`    • ${o}`);
    } else {
      console.log('  ✓ No orphan packages detected');
    }

    if (orphanReport.standalone.length > 0) {
      issueCount += orphanReport.standalone.length;
      console.log(`  ⚠ ${orphanReport.standalone.length} standalone library(s) — nothing depends on them:`);
      for (const s of orphanReport.standalone) console.log(`    • ${s}`);
    }

    if (orphanReport.noInbound.length > 0) {
      console.log(`  ⓘ ${orphanReport.noInbound.length} package(s) with no inbound dependents (excl. apps):`);
      for (const n of orphanReport.noInbound) console.log(`    • ${n}`);
    }
    console.log('');
  }

  // Lineage analysis
  if (lineageReport) {
    console.log('▸ LINEAGE ANALYSIS');

    if (lineageReport.phantomDeps.length > 0) {
      issueCount += lineageReport.phantomDeps.length;
      console.log(`  ✗ ${lineageReport.phantomDeps.length} phantom dependency(s) — declared but not in manifest:`);
      for (const p of lineageReport.phantomDeps) console.log(`    • ${p.from} → ${p.to}`);
    } else {
      console.log('  ✓ No phantom dependencies');
    }

    if (lineageReport.cycles.length > 0) {
      issueCount += lineageReport.cycles.length;
      console.log(`  ✗ ${lineageReport.cycles.length} circular dependency chain(s):`);
      for (const c of lineageReport.cycles) console.log(`    • ${c.join(' → ')}`);
    } else {
      console.log('  ✓ No circular dependencies');
    }

    if (lineageReport.layerViolations.length > 0) {
      issueCount += lineageReport.layerViolations.length;
      console.log(`  ✗ ${lineageReport.layerViolations.length} layer violation(s):`);
      for (const v of lineageReport.layerViolations) {
        console.log(`    • ${v.from} (${v.fromLayer}) → ${v.to} (${v.toLayer})`);
      }
    } else {
      console.log('  ✓ No layer violations');
    }

    if (lineageReport.unreachableFromApps.length > 0) {
      issueCount += lineageReport.unreachableFromApps.length;
      console.log(`  ⚠ ${lineageReport.unreachableFromApps.length} package(s) unreachable from any app:`);
      for (const u of lineageReport.unreachableFromApps) console.log(`    • ${u}`);
    } else {
      console.log('  ✓ All libraries reachable from at least one app');
    }
    console.log('');
  }

  // File-level import analysis
  if (fileReport) {
    console.log('▸ FILE-LEVEL IMPORT ANALYSIS');
    if (fileReport.broken.length > 0) {
      issueCount += fileReport.broken.length;
      console.log(`  ✗ ${fileReport.broken.length} broken import(s):`);
      for (const b of fileReport.broken) {
        console.log(`    • ${b.file}: import "${b.importSpec}" — ${b.reason}`);
      }
    } else {
      console.log('  ✓ All cross-package imports are valid');
    }
    console.log(`  ⓘ ${fileReport.edges.length} total cross-package import edge(s) scanned`);
    console.log('');
  }

  console.log(`${SEP}`);
  if (issueCount === 0) {
    console.log('  ✓ ALL CLEAR — No dependency issues found');
  } else {
    console.log(`  ✗ ${issueCount} issue(s) found`);
  }
  console.log(`${SEP}\n`);

  return issueCount;
}

// ─── JSON Report Builder ────────────────────────────────────────────────────

function buildJsonReport(nodes, orphanReport, lineageReport, fileReport) {
  const packages = [];
  for (const [name, node] of nodes) {
    packages.push({
      name,
      dir: node.dir,
      type: node.type,
      layer: node.layer,
      runtimeDeps: node.runtimeDeps,
      devDeps: node.devDeps,
      dependents: node.dependents,
      depCount: node.runtimeDeps.length,
      dependentCount: node.dependents.length,
    });
  }

  // Compute fan-in / fan-out metrics
  const metrics = packages.map((p) => ({
    name: p.name,
    fanIn: p.dependentCount,
    fanOut: p.depCount,
    instability: p.depCount + p.dependentCount === 0
      ? 0
      : p.depCount / (p.depCount + p.dependentCount),
  }));

  return {
    schemaVersion: '1.0',
    toolId: 'DEP_GRAPH',
    timestamp: new Date().toISOString(),
    packages,
    metrics,
    orphans: orphanReport ?? null,
    lineage: lineageReport ?? null,
    fileImports: fileReport
      ? { brokenCount: fileReport.broken.length, broken: fileReport.broken, edgeCount: fileReport.edges.length }
      : null,
    summary: {
      totalPackages: packages.length,
      totalEdges: packages.reduce((s, p) => s + p.depCount, 0),
      orphanCount: orphanReport?.orphans?.length ?? 0,
      standaloneCount: orphanReport?.standalone?.length ?? 0,
      phantomCount: lineageReport?.phantomDeps?.length ?? 0,
      cycleCount: lineageReport?.cycles?.length ?? 0,
      layerViolationCount: lineageReport?.layerViolations?.length ?? 0,
      unreachableCount: lineageReport?.unreachableFromApps?.length ?? 0,
      brokenImportCount: fileReport?.broken?.length ?? 0,
    },
  };
}

// ─── Render SVG ─────────────────────────────────────────────────────────────

function renderSvg(dotContent, dotPath) {
  const svgPath = dotPath.replace('.dot', '.svg');
  const pngPath = dotPath.replace('.dot', '.png');

  try {
    execSync('dot -V', { stdio: 'pipe' });
  } catch {
    console.warn(
      '\n⚠ Graphviz `dot` not found. Install it to render SVG/PNG:\n' +
      '  Windows: winget install Graphviz  (or choco install graphviz)\n' +
      '  macOS:   brew install graphviz\n' +
      '  Linux:   sudo apt install graphviz\n' +
      `\nDOT file saved to: ${relative(REPO_ROOT, dotPath)}\n` +
      'You can render manually: dot -Tsvg -o output.svg dep-graph.dot\n'
    );
    return;
  }

  try {
    execSync(`dot -Tsvg "${dotPath}" -o "${svgPath}"`, { stdio: 'pipe' });
    console.log(`  SVG: ${relative(REPO_ROOT, svgPath)}`);
  } catch (e) {
    console.error(`  Failed to render SVG: ${e.message}`);
  }

  try {
    execSync(`dot -Tpng "${dotPath}" -o "${pngPath}"`, { stdio: 'pipe' });
    console.log(`  PNG: ${relative(REPO_ROOT, pngPath)}`);
  } catch {
    // PNG rendering is optional (some systems lack png support)
  }
}

// ─── Diff / Regression Detection ────────────────────────────────────────────

function diffReports(currentReport, baselinePath) {
  const baseline = loadJson(baselinePath);
  if (!baseline) {
    console.error(`  ⚠ Could not load baseline: ${baselinePath}`);
    return { regressions: 0, improvements: 0, lines: [] };
  }

  const lines = [];
  let regressions = 0;
  let improvements = 0;

  const fields = [
    ['orphanCount', 'Orphan packages'],
    ['standaloneCount', 'Standalone libraries'],
    ['phantomCount', 'Phantom dependencies'],
    ['cycleCount', 'Circular dependency chains'],
    ['layerViolationCount', 'Layer violations'],
    ['unreachableCount', 'Unreachable packages'],
    ['brokenImportCount', 'Broken file imports'],
  ];

  const cur = currentReport.summary;
  const prev = baseline.summary;

  for (const [key, label] of fields) {
    const curVal = cur[key] ?? 0;
    const prevVal = prev[key] ?? 0;
    const delta = curVal - prevVal;
    if (delta > 0) {
      regressions += delta;
      lines.push(`  ✗ ${label}: ${prevVal} → ${curVal} (+${delta} regression)`);
    } else if (delta < 0) {
      improvements += Math.abs(delta);
      lines.push(`  ✓ ${label}: ${prevVal} → ${curVal} (${delta} improved)`);
    }
  }

  // New packages added
  const curPkgs = new Set(currentReport.packages.map((p) => p.name));
  const prevPkgs = new Set(baseline.packages.map((p) => p.name));
  const added = [...curPkgs].filter((p) => !prevPkgs.has(p));
  const removed = [...prevPkgs].filter((p) => !curPkgs.has(p));
  if (added.length > 0) lines.push(`  + Packages added: ${added.join(', ')}`);
  if (removed.length > 0) lines.push(`  - Packages removed: ${removed.join(', ')}`);

  // Edge count changes
  const edgeDelta = cur.totalEdges - prev.totalEdges;
  if (edgeDelta !== 0) {
    lines.push(`  ${edgeDelta > 0 ? '△' : '▽'} Dependency edges: ${prev.totalEdges} → ${cur.totalEdges} (${edgeDelta > 0 ? '+' : ''}${edgeDelta})`);
  }

  return { regressions, improvements, lines };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🔍 Building @afenda dependency graph…\n');

  // 1. Build the graph
  const { nodes } = buildGraph();
  console.log(`  Found ${nodes.size} packages in manifest`);

  // 2. Run analyses
  const orphanReport = FLAGS.orphans ? detectOrphans(nodes) : null;
  const lineageReport = FLAGS.lineage ? detectBrokenLineage(nodes) : null;
  const fileReport = FLAGS.imports ? buildFileImportGraph(nodes) : null;

  // 3. Generate DOT
  const dot = generateDot(nodes, orphanReport, lineageReport);
  ensureDir(OUT_DIR);

  const dotPath = join(OUT_DIR, FLAGS.pkg
    ? `dep-graph-${FLAGS.pkg.replace('@afenda/', '')}.dot`
    : 'dep-graph.dot'
  );
  writeFileSync(dotPath, dot, 'utf-8');
  console.log(`  DOT: ${relative(REPO_ROOT, dotPath)}`);

  // 4. Render SVG if requested
  if (FLAGS.render) {
    renderSvg(dot, dotPath);
  }

  // 5. Print console report
  const issueCount = printConsoleReport(orphanReport, lineageReport, fileReport);

  // 6. Write JSON report
  if (FLAGS.json || FLAGS.diff) {
    const report = buildJsonReport(nodes, orphanReport, lineageReport, fileReport);
    const jsonPath = join(OUT_DIR, FLAGS.pkg
      ? `dep-graph-${FLAGS.pkg.replace('@afenda/', '')}.json`
      : 'dep-graph.json'
    );
    writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`  JSON: ${relative(REPO_ROOT, jsonPath)}`);

    // 6b. Diff against baseline
    if (FLAGS.diff) {
      const diffPath = resolve(FLAGS.diff);
      const { regressions, improvements, lines } = diffReports(report, diffPath);
      const SEP = '─'.repeat(60);
      console.log(`\n${SEP}`);
      console.log('  REGRESSION DIFF vs ' + relative(REPO_ROOT, diffPath));
      console.log(`${SEP}\n`);
      if (lines.length === 0) {
        console.log('  ✓ No changes detected');
      } else {
        for (const l of lines) console.log(l);
      }
      console.log(`\n  Regressions: ${regressions}  |  Improvements: ${improvements}`);
      console.log(`${SEP}\n`);
      if (FLAGS.fail && regressions > 0) {
        console.log(`  ✗ ${regressions} regression(s) — failing`);
        process.exit(1);
      }
    }
  }

  // 7. Exit code
  if (FLAGS.fail && issueCount > 0) {
    process.exit(1);
  }
}

main();
