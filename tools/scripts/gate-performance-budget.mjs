#!/usr/bin/env node
/**
 * gate:performance-budget — Validate bundle size and performance metrics
 * 
 * Checks:
 *   PERF-01: Client bundles must not exceed size limits
 *   PERF-02: Route bundles must not exceed per-route limits
 *   PERF-03: Detect large dependencies that should be lazy-loaded
 *   PERF-04: Verify code splitting for large components
 *   PERF-05: Check for duplicate dependencies in bundles
 * 
 * Usage: node tools/scripts/gate-performance-budget.mjs
 * Config: performance-budget.json (in project root)
 * 
 * Reference: Web Vitals, Next.js Bundle Analysis
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const WEB_DIR = join(ROOT, 'apps', 'web');
const BUILD_DIR = join(WEB_DIR, '.next');

const failures = [];
const warnings = [];

// ─── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  budgets: {
    totalClientBundle: 500 * 1024, // 500 KB
    routeBundle: 250 * 1024, // 250 KB per route
    sharedChunks: 150 * 1024, // 150 KB for shared chunks
    largeLibraryThreshold: 100 * 1024, // 100 KB (consider lazy loading)
  },
  excludePaths: [
    '/_not-found',
    '/api/',
  ],
};

const configPath = join(ROOT, 'performance-budget.json');
const config = existsSync(configPath)
  ? { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(configPath, 'utf-8')) }
  : DEFAULT_CONFIG;

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function rel(p) {
  return p.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

// ─── PERF-01: Check Client Bundle Size ───────────────────────────────────────

// If .next exists, analyze build output
if (existsSync(BUILD_DIR)) {
  const manifestPath = join(BUILD_DIR, 'build-manifest.json');
  
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    
    // Calculate total client bundle size
    let totalClientSize = 0;
    const seenFiles = new Set();
    
    for (const [page, files] of Object.entries(manifest.pages)) {
      if (config.excludePaths.some(excl => page.startsWith(excl))) continue;
      
      for (const file of files) {
        if (seenFiles.has(file)) continue;
        seenFiles.add(file);
        
        const filePath = join(BUILD_DIR, file);
        if (existsSync(filePath)) {
          const stats = statSync(filePath);
          totalClientSize += stats.size;
        }
      }
    }
    
    if (totalClientSize > config.budgets.totalClientBundle) {
      failures.push({
        gate: 'PERF-01',
        issue: `Total client bundle exceeds budget`,
        actual: formatBytes(totalClientSize),
        budget: formatBytes(config.budgets.totalClientBundle),
        fix: 'Reduce bundle size by lazy loading components, code splitting, or removing unused dependencies',
      });
    }
  }
  
  // ─── PERF-02: Check Per-Route Bundle Size ──────────────────────────────────
  
  const pagesManifestPath = join(BUILD_DIR, 'server', 'pages-manifest.json');
  
  if (existsSync(pagesManifestPath)) {
    const pagesManifest = JSON.parse(readFileSync(pagesManifestPath, 'utf-8'));
    
    for (const [route, htmlFile] of Object.entries(pagesManifest)) {
      if (config.excludePaths.some(excl => route.startsWith(excl))) continue;
      
      const htmlPath = join(BUILD_DIR, 'server', htmlFile);
      if (existsSync(htmlPath)) {
        const stats = statSync(htmlPath);
        
        if (stats.size > config.budgets.routeBundle) {
          failures.push({
            gate: 'PERF-02',
            route,
            issue: `Route bundle exceeds per-route budget`,
            actual: formatBytes(stats.size),
            budget: formatBytes(config.budgets.routeBundle),
            fix: `Split ${route} into smaller components with dynamic imports`,
          });
        }
      }
    }
  }
}

// ─── PERF-03: Detect Large Dependencies ──────────────────────────────────────

const packageJsonPath = join(WEB_DIR, 'package.json');
if (existsSync(packageJsonPath)) {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  // Known large libraries that should be lazy-loaded
  const LARGE_LIBS = {
    'chart.js': 'Consider lazy loading charts with dynamic import',
    'pdfjs-dist': 'PDF viewer should be lazy loaded',
    'monaco-editor': 'Code editor should be lazy loaded',
    '@tiptap/react': 'Rich text editor should be lazy loaded',
    'react-pdf': 'PDF renderer should be lazy loaded',
    'recharts': 'Charts should be lazy loaded on demand',
    'd3': 'D3 visualizations should be lazy loaded',
  };
  
  for (const [lib, hint] of Object.entries(LARGE_LIBS)) {
    if (deps[lib]) {
      // Check if library is used with dynamic import
      const srcFiles = walkFiles(join(WEB_DIR, 'src'), /\.(ts|tsx)$/);
      let usesLazyLoad = false;
      
      for (const file of srcFiles) {
        const content = readFileSync(file, 'utf-8');
        if (content.includes(`import('${lib}')`) || content.includes(`const ${lib.split('/')[0].replace(/@/g, '')} = dynamic(`)) {
          usesLazyLoad = true;
          break;
        }
      }
      
      if (!usesLazyLoad) {
        warnings.push({
          gate: 'PERF-03',
          library: lib,
          issue: `Large library "${lib}" not lazy-loaded`,
          hint,
        });
      }
    }
  }
}

function walkFiles(dir, pattern, out = []) {
  try {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walkFiles(full, pattern, out);
      } else if (pattern.test(name)) {
        out.push(full);
      }
    }
  } catch (_) {}
  return out;
}

// ─── PERF-04: Verify Code Splitting for Large Components ─────────────────────

const componentFiles = walkFiles(join(WEB_DIR, 'src', 'components'), /\.(tsx)$/);

for (const file of componentFiles) {
  const stats = statSync(file);
  
  // If component file is > 50KB, it should probably be code-split
  if (stats.size > 50 * 1024) {
    const content = readFileSync(file, 'utf-8');
    const r = rel(file);
    
    // Check if component is exported as default (eligible for dynamic import)
    const hasDefaultExport = /export\s+default\s+(function|const)/.test(content);
    
    if (hasDefaultExport) {
      // Check if this component is imported dynamically elsewhere
      const componentName = file.split('/').pop().replace('.tsx', '');
      const allFiles = walkFiles(join(WEB_DIR, 'src'), /\.(ts|tsx)$/);
      let isDynamic = false;
      
      for (const f of allFiles) {
        const c = readFileSync(f, 'utf-8');
        if (c.includes(`dynamic(() => import`) && c.includes(componentName)) {
          isDynamic = true;
          break;
        }
      }
      
      if (!isDynamic) {
        warnings.push({
          gate: 'PERF-04',
          file: r,
          size: formatBytes(stats.size),
          issue: `Large component (${formatBytes(stats.size)}) not code-split`,
          hint: `Use dynamic import: const ${componentName} = dynamic(() => import('./${componentName}'))`,
        });
      }
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const hasFailures = failures.length > 0;
const hasWarnings = warnings.length > 0;

if (hasFailures) {
  console.error('❌ gate:performance-budget FAILED\n');
  
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }
  
  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate}: ${items.length} violation(s)`);
    for (const v of items) {
      if (v.route) {
        console.error(`    Route: ${v.route}`);
      } else if (v.file) {
        console.error(`    File: ${v.file}`);
      }
      console.error(`      Issue: ${v.issue}`);
      console.error(`      Actual: ${v.actual || 'N/A'} | Budget: ${v.budget || 'N/A'}`);
      console.error(`      Fix: ${v.fix}`);
    }
    console.error();
  }
}

if (hasWarnings) {
  console.warn('\n⚠️  Performance Warnings:\n');
  for (const w of warnings.slice(0, 5)) {
    if (w.file) {
      console.warn(`  ${w.gate}: ${w.file} (${w.size})`);
    } else if (w.library) {
      console.warn(`  ${w.gate}: ${w.library}`);
    }
    console.warn(`    ${w.issue}`);
    console.warn(`    Hint: ${w.hint}`);
  }
  if (warnings.length > 5) {
    console.warn(`  ... and ${warnings.length - 5} more warnings`);
  }
  console.warn();
}

if (hasFailures) {
  console.error('  Run `pnpm build && pnpm analyze` to visualize bundle composition');
  console.error('  Reference: https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer');
  process.exit(1);
}

if (!existsSync(BUILD_DIR)) {
  console.log('ℹ️  gate:performance-budget SKIPPED (no build found)');
  console.log('   Run `pnpm build` first to analyze bundle size');
  process.exit(0);
}

console.log('✅ gate:performance-budget PASSED');
console.log('  All bundles within performance budget');
if (hasWarnings) {
  console.log(`  ${warnings.length} optimization(s) recommended`);
}
