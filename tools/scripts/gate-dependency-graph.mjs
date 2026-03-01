#!/usr/bin/env node
/**
 * gate:dependency-graph — Validate monorepo dependency graph.
 *
 * Fails on:
 *   - Circular dependencies between packages
 *   - Missing workspace dependencies
 *   - Incorrect dependency types (should be workspace:*)
 *   - Packages importing from other packages not declared as dependencies
 *
 * Usage: node tools/scripts/gate-dependency-graph.mjs
 * Reference: .agents/skills/turborepo/references/best-practices/dependencies.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

const failures = [];
const packages = new Map();

// ─── Discover Packages ───────────────────────────────────────────────────────

function discoverPackages() {
  const dirs = ['apps', 'packages'];
  
  for (const dir of dirs) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    
    function walk(p) {
      try {
        for (const name of readdirSync(p)) {
          const full = join(p, name);
          if (!statSync(full).isDirectory()) continue;
          
          const pkgPath = join(full, 'package.json');
          if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            if (pkg.name) {
              packages.set(pkg.name, {
                name: pkg.name,
                path: full,
                pkg,
                deps: new Set([
                  ...Object.keys(pkg.dependencies || {}),
                  ...Object.keys(pkg.devDependencies || {}),
                ]),
              });
            }
          } else {
            // Recurse for nested packages (e.g., packages/modules/*)
            walk(full);
          }
        }
      } catch (_) {}
    }
    
    walk(dirPath);
  }
}

// ─── Check for Circular Dependencies ─────────────────────────────────────────

function checkCircularDeps() {
  for (const [pkgName, { deps }] of packages) {
    const visited = new Set();
    const stack = [];
    
    function visit(name) {
      if (stack.includes(name)) {
        const cycle = [...stack.slice(stack.indexOf(name)), name];
        failures.push({
          gate: 'DEP-01',
          name: 'Circular dependency detected',
          hint: `Cycle: ${cycle.join(' → ')}`,
        });
        return true;
      }
      
      if (visited.has(name)) return false;
      visited.add(name);
      
      const pkg = packages.get(name);
      if (!pkg) return false;
      
      stack.push(name);
      for (const dep of pkg.deps) {
        if (packages.has(dep)) {
          if (visit(dep)) return true;
        }
      }
      stack.pop();
      return false;
    }
    
    visit(pkgName);
  }
}

// ─── Check for Missing Workspace Dependencies ────────────────────────────────

function checkMissingDeps() {
  for (const [pkgName, { path, pkg, deps }] of packages) {
    // Scan source files for imports
    const srcDir = join(path, 'src');
    if (!existsSync(srcDir)) continue;
    
    const imports = new Set();
    
    function scanImports(dir) {
      try {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) {
            scanImports(full);
          } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
            const content = readFileSync(full, 'utf-8');
            const importMatches = content.matchAll(/from\s+['"](@afenda\/[^'"]+)['"]/g);
            for (const match of importMatches) {
              imports.add(match[1]);
            }
          }
        }
      } catch (_) {}
    }
    
    scanImports(srcDir);
    
    // Check if imported packages are declared as dependencies
    for (const imp of imports) {
      if (imp !== pkgName && packages.has(imp) && !deps.has(imp)) {
        failures.push({
          gate: 'DEP-02',
          name: `${pkgName} imports ${imp} but doesn't declare it as a dependency`,
          hint: `Add "${imp}: "workspace:*"" to dependencies in ${pkgName}/package.json`,
        });
      }
    }
  }
}

// ─── Check Workspace Protocol Usage ──────────────────────────────────────────

function checkWorkspaceProtocol() {
  for (const [pkgName, { pkg }] of packages) {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    
    for (const [dep, version] of Object.entries(allDeps)) {
      if (packages.has(dep) && !version.startsWith('workspace:')) {
        failures.push({
          gate: 'DEP-03',
          name: `${pkgName} → ${dep} should use workspace: protocol`,
          hint: `Change "${dep}": "${version}" to "${dep}": "workspace:*" in ${pkgName}/package.json`,
        });
      }
    }
  }
}

// ─── Run Checks ──────────────────────────────────────────────────────────────

discoverPackages();

if (packages.size === 0) {
  console.error('❌ gate:dependency-graph FAILED');
  console.error('   No packages discovered. Check apps/ and packages/ directories.');
  process.exit(1);
}

checkCircularDeps();
checkMissingDeps();
checkWorkspaceProtocol();

// ─── Report ──────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:dependency-graph FAILED\n');
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }
  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length}):`);
    for (const v of items) {
      console.error(`    ${v.name}`);
      console.error(`       ${v.hint}`);
    }
    console.error('');
  }
  console.error(`${failures.length} dependency issue(s). See .agents/skills/turborepo/references/best-practices/dependencies.md`);
  process.exit(1);
}

console.log('✅ gate:dependency-graph PASSED');
console.log(`   ${packages.size} packages checked`);
console.log('   No circular dependencies or missing workspace declarations');
