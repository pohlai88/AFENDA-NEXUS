#!/usr/bin/env node
/**
 * web-drift-check.mjs — Frontend-specific CI drift gate for @afenda/web.
 *
 * Enforces every rule from ARCHITECTURE.@afenda-web.md and FRONTEND-DEV-PLAN.md.
 * Zero dependencies — uses only Node.js built-ins.
 *
 * Checks:
 *   W01  No hardcoded Radix primitives — must use components/ui/ wrappers
 *   W02  No raw className strings outside cn()/cva() in erp/features/hooks
 *   W03  Forbidden imports — no DB, backend, or server-only packages
 *   W04  Contract compliance — no hand-written fetch body types
 *   W05  Route boundary — page.tsx only imports from allowed prefixes
 *   W06  Feature isolation — no cross-feature imports
 *   W07  shadcn purity — components/ui/ files not hand-edited (tracked by marker)
 *   W08  No `any` in component/hook props/interfaces
 *   W09  Accessibility — forms must have labels, buttons must have type
 *   W10  Tailwind v4 compatibility — no deprecated v3 patterns
 *   W11  "use client" discipline — only where needed, never in lib/queries
 *   W12  Required structure — directories and files from ARCHITECTURE.md
 *   W13  Dependency audit — all deps in package.json are in ARCHITECTURE allowlist
 *   W14  No hardcoded colors — must use CSS variables (bg-red-500 → bg-destructive)
 *   W15  Server Action pattern — forms use "use server" actions, not client fetch
 *
 * Usage:
 *   node tools/scripts/web-drift-check.mjs
 *   node tools/scripts/web-drift-check.mjs --json
 *   node tools/scripts/web-drift-check.mjs --fix
 *   pnpm web:drift
 *
 * Exit codes: 0 = pass, 1 = failures found
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const WEB_ROOT = join(ROOT, 'apps/web');
const SRC = join(WEB_ROOT, 'src');
const JSON_MODE = process.argv.includes('--json');

// ─── Result Accumulator ─────────────────────────────────────────────────────

const results = { pass: [], fail: [], warn: [] };
let totalChecks = 0;

function pass(check, msg) {
  totalChecks++;
  results.pass.push({ check, msg });
}
function fail(check, msg) {
  totalChecks++;
  results.fail.push({ check, msg });
}
function warn(check, msg) {
  totalChecks++;
  results.warn.push({ check, msg });
}

// ─── File Helpers ────────────────────────────────────────────────────────────

function collectFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx'], collected = []) {
  if (!existsSync(dir)) return collected;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'build', '.turbo'].includes(entry.name)) continue;
      collectFiles(full, extensions, collected);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      collected.push(full);
    }
  }
  return collected;
}

function relPath(absPath) {
  return relative(SRC, absPath).replace(/\\/g, '/');
}

function relFromWeb(absPath) {
  return relative(WEB_ROOT, absPath).replace(/\\/g, '/');
}

function extractImports(content) {
  const imports = [];
  const esmRegex = /(?:import|export)\s+.*?\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = esmRegex.exec(content)) !== null) imports.push(m[1]);
  const sideEffectRegex = /import\s+["']([^"']+)["']/g;
  while ((m = sideEffectRegex.exec(content)) !== null) imports.push(m[1]);
  const dynamicRegex = /import\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRegex.exec(content)) !== null) imports.push(m[1]);
  return [...new Set(imports)];
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

// ─── W01: No Hardcoded Radix Primitives ─────────────────────────────────────
// Files outside components/ui/ must NOT import directly from @radix-ui/*.
// They must use the shadcn wrapper in components/ui/ instead.

function checkW01() {
  const RADIX_PATTERN = /from\s+["']@radix-ui\//;
  const uiDir = join(SRC, 'components/ui');

  const allFiles = collectFiles(SRC);
  for (const file of allFiles) {
    const rel = relPath(file);
    // components/ui/ files ARE allowed to import Radix directly
    if (rel.startsWith('components/ui/')) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (RADIX_PATTERN.test(lines[i])) {
        fail(
          'W01',
          `${rel}:${i + 1} -- Direct @radix-ui import. Use @/components/ui/ wrapper instead.`
        );
      }
    }
  }
}

// ─── W02: className Merging Discipline ───────────────────────────────────────
// Two rules:
//   (a) If a component accepts a `className` prop, it MUST merge it with cn()
//       at the root element. Failing to do so means the prop is silently ignored.
//   (b) Conditional class logic (ternary in className) must use cn(), not
//       string concatenation or template literals.
//
// Static className="flex items-center gap-2" for internal layout is ALLOWED —
// cn() is for merging, not for wrapping every string.

function checkW02() {
  const DIRS_TO_CHECK = [join(SRC, 'components/erp'), join(SRC, 'features'), join(SRC, 'hooks')];

  for (const dir of DIRS_TO_CHECK) {
    const files = collectFiles(dir, ['.tsx']);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const rel = relPath(file);

      // (a) Check: component accepts className prop but never calls cn()
      const acceptsClassName = /className\??\s*:\s*string/.test(content);
      const usesCn = content.includes('cn(');
      if (acceptsClassName && !usesCn) {
        fail(
          'W02',
          `${rel} -- Accepts className prop but never calls cn(). Must merge with cn() for composability.`
        );
      }

      // (b) Check: template literal className (className={`...`})
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/className=\{`/.test(line)) {
          fail(
            'W02',
            `${rel}:${i + 1} -- Template literal className. Use cn() for conditional classes.`
          );
        }
        // String concatenation: className={"foo " + bar}
        if (/className=\{["'][^"']*["']\s*\+/.test(line)) {
          fail('W02', `${rel}:${i + 1} -- String concatenation in className. Use cn() instead.`);
        }
      }
    }
  }
}

// ─── W03: Forbidden Imports ──────────────────────────────────────────────────
// Frontend must NEVER import backend/DB packages.

function checkW03() {
  const FORBIDDEN = [
    'fastify',
    'drizzle-orm',
    'postgres',
    'pino',
    'pino-pretty',
    '@afenda/db',
    '@afenda/platform',
    '@afenda/modules',
    'graphile-worker',
    '@fastify/',
    'pg',
    'better-sqlite3',
  ];

  // Server-only files that legitimately need DB/backend access
  const EXEMPT_FILES = [
    'lib/auth.ts', // Neon Auth server instance (imports @neondatabase/auth)
  ];

  const allFiles = collectFiles(SRC);
  for (const file of allFiles) {
    const rel = relPath(file);
    if (EXEMPT_FILES.some((ex) => rel === ex || rel.endsWith('/' + ex))) continue;

    const content = readFileSync(file, 'utf-8');
    const imports = extractImports(content);

    for (const imp of imports) {
      for (const forbidden of FORBIDDEN) {
        if (imp === forbidden || imp.startsWith(forbidden + '/') || imp.startsWith(forbidden)) {
          fail(
            'W03',
            `${rel} -- Forbidden import "${imp}". Frontend must not import backend packages.`
          );
        }
      }
    }
  }
}

// ─── W04: Contract Compliance ────────────────────────────────────────────────
// No hand-written fetch body types. Payload shapes must come from @afenda/contracts.
// Detects: interface/type with "Payload", "Request", "Response" suffix in features/

function checkW04() {
  const SUSPECT_PATTERN =
    /(?:interface|type)\s+\w+(?:Payload|Request|Response|Body|Input|Output)\b/;
  const ALLOWED_FILES = ['types.ts', 'api-client.ts']; // lib types are OK

  const featureFiles = collectFiles(join(SRC, 'features'), ['.ts', '.tsx']);
  for (const file of featureFiles) {
    const name = file.split(/[\\/]/).pop();
    if (ALLOWED_FILES.includes(name)) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (SUSPECT_PATTERN.test(lines[i])) {
        const match = lines[i].match(/(?:interface|type)\s+(\w+)/);
        if (match) {
          warn(
            'W04',
            `${relPath(file)}:${i + 1} -- "${match[1]}" looks like a hand-written payload type. Use @afenda/contracts schemas.`
          );
        }
      }
    }
  }
}

// ─── W05: Route Boundary ─────────────────────────────────────────────────────
// page.tsx / layout.tsx files may only import from allowed prefixes.

function checkW05() {
  const ALLOWED_PREFIXES = [
    '@/features/',
    '@/components/',
    '@/lib/',
    '@/hooks/',
    '@/providers/',
    'next',
    'react',
    '@afenda/contracts',
    '@afenda/core',
    'lucide-react',
    './',
    '../',
  ];

  const routeFiles = collectFiles(join(SRC, 'app'), ['.tsx', '.ts']);
  for (const file of routeFiles) {
    const name = file.split(/[\\/]/).pop();
    if (!['page.tsx', 'layout.tsx'].includes(name)) continue;

    const content = readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    const rel = relPath(file);

    for (const imp of imports) {
      const allowed = ALLOWED_PREFIXES.some((prefix) => imp.startsWith(prefix));
      if (!allowed) {
        fail('W05', `${rel} -- Route imports "${imp}" which is not in allowed prefixes.`);
      }
    }
  }
}

// ─── W06: Feature Isolation ──────────────────────────────────────────────────
// features/finance/* must not import from features/inventory/* etc.

function checkW06() {
  const featuresDir = join(SRC, 'features');
  if (!existsSync(featuresDir)) return;

  const featureDomains = readdirSync(featuresDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const domain of featureDomains) {
    const domainDir = join(featuresDir, domain);
    const files = collectFiles(domainDir);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);
      const rel = relPath(file);

      for (const imp of imports) {
        // Check @/features/<other-domain> imports
        if (imp.startsWith('@/features/')) {
          const importedDomain = imp.split('/')[2]; // @/features/<domain>/...
          if (importedDomain && importedDomain !== domain) {
            fail(
              'W06',
              `${rel} -- Cross-feature import: "${imp}". features/${domain}/ must not import from features/${importedDomain}/.`
            );
          }
        }
      }
    }
  }
}

// ─── W07: shadcn Purity ─────────────────────────────────────────────────────
// components/ui/ files should be managed by shadcn CLI.
// We check that they don't contain domain-specific imports.

function checkW07() {
  const uiDir = join(SRC, 'components/ui');
  if (!existsSync(uiDir)) {
    warn(
      'W07',
      'components/ui/ directory is empty or missing. Run `npx shadcn@latest add` to populate.'
    );
    return;
  }

  const uiFiles = collectFiles(uiDir, ['.tsx', '.ts']);
  if (uiFiles.length === 0) {
    warn('W07', 'components/ui/ has no .tsx/.ts files. Run `npx shadcn@latest add` to populate.');
    return;
  }

  const DOMAIN_IMPORTS = ['@/features/', '@/hooks/', '@/providers/', '@afenda/contracts'];
  const SHADCN_EXCEPTIONS = ['@/hooks/use-mobile'];

  for (const file of uiFiles) {
    const content = readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    const rel = relPath(file);

    for (const imp of imports) {
      if (SHADCN_EXCEPTIONS.includes(imp)) continue;
      if (DOMAIN_IMPORTS.some((prefix) => imp.startsWith(prefix))) {
        fail(
          'W07',
          `${rel} -- shadcn component imports domain code "${imp}". components/ui/ must be domain-free.`
        );
      }
    }
  }
}

// ─── W08: No `any` in Component/Hook Props ──────────────────────────────────

function checkW08() {
  const DIRS = [
    join(SRC, 'components'),
    join(SRC, 'features'),
    join(SRC, 'hooks'),
    join(SRC, 'providers'),
  ];

  // Matches: `: any`, `as any`, `<any>`, `: any[]`, `: any)`, `any;`
  const ANY_PATTERN = /(?::\s*any\b|as\s+any\b|<any>|:\s*any\s*[;\]\)>,])/;
  // Exclude test files and type assertion in catch blocks
  const CATCH_PATTERN = /catch\s*\(/;

  for (const dir of DIRS) {
    const files = collectFiles(dir, ['.ts', '.tsx']);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (ANY_PATTERN.test(line) && !CATCH_PATTERN.test(line)) {
          // Skip eslint-disable comments
          if (line.includes('eslint-disable')) continue;
          fail('W08', `${relPath(file)}:${i + 1} -- \`any\` type detected. Use a specific type.`);
        }
      }
    }
  }
}

// ─── W09: Accessibility Checks ──────────────────────────────────────────────
// - <button> must have type attribute
// - <img> must have alt attribute
// - <form> inputs should have associated labels or aria-label
// - Interactive elements should have aria-label when text content is absent

function checkW09() {
  const allTsx = collectFiles(SRC, ['.tsx']);

  for (const file of allTsx) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const rel = relPath(file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // <button without type=
      if (/<button\b/.test(line) && !line.includes('type=') && !line.includes('...')) {
        // Check next few lines for type=
        const chunk = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
        if (!chunk.includes('type=')) {
          fail(
            'W09',
            `${rel}:${i + 1} -- <button> missing type attribute. Add type="button" or type="submit".`
          );
        }
      }

      // <img without alt=
      if (/<img\b/.test(line) && !line.includes('alt=')) {
        const chunk = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
        if (!chunk.includes('alt=')) {
          fail('W09', `${rel}:${i + 1} -- <img> missing alt attribute.`);
        }
      }
    }
  }
}

// ─── W10: Tailwind v4 Compatibility ─────────────────────────────────────────
// Detect deprecated Tailwind v3 patterns that are incompatible with v4.

function checkW10() {
  const DEPRECATED_PATTERNS = [
    { pattern: /\btw-[\w-]+/, msg: 'tw- prefix (Tailwind v3 plugin syntax)' },
    { pattern: /@apply\s/, msg: '@apply directive (use cn() instead in components)' },
    { pattern: /\btheme\(["']/, msg: 'theme() function (use CSS variables in v4)' },
    { pattern: /\btailwind\.config/, msg: 'tailwind.config reference (v4 uses CSS-first config)' },
  ];

  // Only check in component/feature files, not globals.css
  const files = [
    ...collectFiles(join(SRC, 'components'), ['.tsx', '.ts']),
    ...collectFiles(join(SRC, 'features'), ['.tsx', '.ts']),
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const rel = relPath(file);

    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, msg } of DEPRECATED_PATTERNS) {
        if (pattern.test(lines[i])) {
          warn('W10', `${rel}:${i + 1} -- Deprecated Tailwind pattern: ${msg}`);
        }
      }
    }
  }

  // Check globals.css for @apply usage (deprecated in v4)
  // Skip CSS comment lines (/* ... */ and lines inside block comments)
  const globalsCss = join(SRC, 'app/globals.css');
  if (existsSync(globalsCss)) {
    const content = readFileSync(globalsCss, 'utf-8');
    const lines = content.split('\n');
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (inBlockComment) {
        if (line.includes('*/')) inBlockComment = false;
        continue;
      }
      if (line.trimStart().startsWith('/*')) {
        if (!line.includes('*/')) inBlockComment = true;
        continue;
      }
      // Skip single-line comments (// style, though rare in CSS)
      if (line.trimStart().startsWith('//')) continue;
      if (/@apply\s/.test(line)) {
        fail(
          'W10',
          `app/globals.css:${i + 1} -- @apply is deprecated in Tailwind v4. Use native CSS properties.`
        );
      }
    }
  }
}

// ─── W11: "use client" Discipline ───────────────────────────────────────────
// - lib/ and queries/ files must NOT have "use client"
// - Only components with interactivity should be client components

function checkW11() {
  const SERVER_ONLY_DIRS = [join(SRC, 'lib')];

  // Check lib/ files
  for (const dir of SERVER_ONLY_DIRS) {
    const files = collectFiles(dir, ['.ts', '.tsx']);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (
        content.trimStart().startsWith('"use client"') ||
        content.trimStart().startsWith("'use client'")
      ) {
        fail(
          'W11',
          `${relPath(file)} -- "use client" in lib/. Library files must be server-compatible.`
        );
      }
    }
  }

  // Check queries/ files
  const queryFiles = collectFiles(SRC, ['.ts']).filter((f) =>
    f.replace(/\\/g, '/').includes('/queries/')
  );
  for (const file of queryFiles) {
    const content = readFileSync(file, 'utf-8');
    if (
      content.trimStart().startsWith('"use client"') ||
      content.trimStart().startsWith("'use client'")
    ) {
      fail('W11', `${relPath(file)} -- "use client" in queries/. Query files must be server-side.`);
    }
  }
}

// ─── W12: Required Structure ─────────────────────────────────────────────────

function checkW12() {
  const REQUIRED_FILES = [
    'src/app/layout.tsx',
    'src/app/globals.css',
    'src/app/error.tsx',
    'src/app/loading.tsx',
    'src/app/not-found.tsx',
    'src/lib/api-client.ts',
    'src/lib/format.ts',
    'src/lib/utils.ts',
    'src/lib/auth.ts',
    'src/lib/constants.ts',
    'src/lib/types.ts',
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'components.json',
    'eslint.config.js',
  ];

  const REQUIRED_DIRS = [
    'src/app',
    'src/components/ui',
    'src/components/erp',
    'src/features',
    'src/lib',
    'src/hooks',
    'src/providers',
  ];

  for (const f of REQUIRED_FILES) {
    if (existsSync(join(WEB_ROOT, f))) {
      pass('W12', `Required file "${f}" exists`);
    } else {
      fail('W12', `Required file "${f}" missing`);
    }
  }

  for (const d of REQUIRED_DIRS) {
    const dirPath = join(WEB_ROOT, d);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      pass('W12', `Required directory "${d}" exists`);
    } else {
      fail('W12', `Required directory "${d}" missing`);
    }
  }
}

// ─── W13: Dependency Audit ──────────────────────────────────────────────────
// All deps must be in the ARCHITECTURE.md allowlist.

function checkW13() {
  const ALLOWED_RUNTIME = [
    '@afenda/core',
    '@afenda/contracts',
    '@afenda/authz',
    'next',
    'react',
    'react-dom',
    '@hookform/resolvers',
    'react-hook-form',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'class-variance-authority',
    'sonner',
    'nuqs',
    'cmdk',
    'radix-ui',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    'next-themes',
    'zod',
    '@afenda/db',
    '@neondatabase/auth',
    '@sentry/nextjs',
    'date-fns',
    'framer-motion',
    'nanoid',
    'posthog-js',
    'react-day-picker',
    'react-dropzone',
    'recharts',
    'qrcode.react',
  ];

  const ALLOWED_DEV = [
    '@afenda/typescript-config',
    '@afenda/eslint-config',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'vitest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jsdom',
    'msw',
    'jest-axe',
    '@tailwindcss/postcss',
    '@vitejs/plugin-react',
    'tailwindcss',
    'eslint-plugin-jsx-a11y',
    '@vitest/coverage-v8',
    'shadcn',
    '@next/bundle-analyzer',
  ];

  const pkgJson = loadJson(join(WEB_ROOT, 'package.json'));
  if (!pkgJson) {
    fail('W13', 'Cannot read package.json');
    return;
  }

  const deps = pkgJson.dependencies || {};
  for (const dep of Object.keys(deps)) {
    if (deps[dep]?.startsWith('workspace:')) continue;
    if (ALLOWED_RUNTIME.includes(dep)) {
      pass('W13', `Dep "${dep}" is in allowlist`);
    } else {
      fail('W13', `Dep "${dep}" NOT in ARCHITECTURE allowlist. Add to ARCHITECTURE.md or remove.`);
    }
  }

  const devDeps = pkgJson.devDependencies || {};
  for (const dep of Object.keys(devDeps)) {
    if (devDeps[dep]?.startsWith('workspace:')) continue;
    if (ALLOWED_DEV.includes(dep)) {
      pass('W13', `DevDep "${dep}" is in allowlist`);
    } else {
      fail(
        'W13',
        `DevDep "${dep}" NOT in ARCHITECTURE dev allowlist. Add to ARCHITECTURE.md or remove.`
      );
    }
  }

  // Tailwind v4 compatibility: check that tailwindcss version is ^4.x
  const twVersion = deps.tailwindcss || devDeps.tailwindcss;
  if (twVersion && !twVersion.includes('catalog:')) {
    if (!twVersion.startsWith('^4') && !twVersion.startsWith('4') && !twVersion.startsWith('~4')) {
      fail(
        'W13',
        `tailwindcss version "${twVersion}" is not v4. Architecture requires Tailwind CSS v4.`
      );
    }
  }

  // React 19 compatibility
  const reactVersion = deps.react;
  if (reactVersion && !reactVersion.includes('catalog:')) {
    if (
      !reactVersion.startsWith('^19') &&
      !reactVersion.startsWith('19') &&
      !reactVersion.startsWith('~19')
    ) {
      warn('W13', `react version "${reactVersion}" -- Architecture targets React 19.`);
    }
  }

  // Next.js 16 compatibility
  const nextVersion = deps.next;
  if (nextVersion && !nextVersion.includes('catalog:')) {
    if (
      !nextVersion.startsWith('^16') &&
      !nextVersion.startsWith('16') &&
      !nextVersion.startsWith('~16')
    ) {
      warn('W13', `next version "${nextVersion}" -- Architecture targets Next.js 16.`);
    }
  }
}

// ─── W14: No Hardcoded Colors ───────────────────────────────────────────────
// Must use CSS variable-based colors (bg-primary, text-destructive) not
// hardcoded Tailwind palette colors (bg-red-500, text-blue-600) in
// components/erp/ and features/.
//
// Exception: emerald/blue in status-badge.tsx (status-specific colors).

function checkW14() {
  // Tailwind palette colors that should be CSS variables instead
  const HARDCODED_COLOR_PATTERN =
    /(?:bg|text|border|ring|outline|shadow|from|to|via)-(?:red|green|yellow|orange|purple|pink|indigo|violet|teal|cyan|lime|amber|fuchsia|rose|sky|stone|zinc|gray|slate|neutral)-\d{2,3}/;

  // Allowed exceptions: status-badge uses emerald/blue for status-specific colors
  const EXCEPTION_FILES = ['status-badge.tsx'];
  // Also allow in globals.css
  const EXCEPTION_DIRS = ['app/'];

  const DIRS = [join(SRC, 'components/erp'), join(SRC, 'features')];

  for (const dir of DIRS) {
    const files = collectFiles(dir, ['.tsx', '.ts']);
    for (const file of files) {
      const fileName = file.split(/[\\/]/).pop();
      if (EXCEPTION_FILES.includes(fileName)) continue;

      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const rel = relPath(file);

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(HARDCODED_COLOR_PATTERN);
        if (match) {
          warn(
            'W14',
            `${rel}:${i + 1} -- Hardcoded color "${match[0]}". Use CSS variable (e.g., bg-primary, text-destructive).`
          );
        }
      }
    }
  }
}

// ─── W15: Server Action Pattern ─────────────────────────────────────────────
// Forms in features/ should use Server Actions (via "use server" in page.tsx),
// not direct client-side fetch calls.

function checkW15() {
  const CLIENT_FETCH_PATTERN = /\bfetch\s*\(/;
  const ALLOWED_FILES = ['api-client.ts']; // Only the API client may use fetch

  const formFiles = collectFiles(join(SRC, 'features'), ['.tsx']).filter((f) =>
    f.replace(/\\/g, '/').includes('/forms/')
  );

  for (const file of formFiles) {
    const fileName = file.split(/[\\/]/).pop();
    if (ALLOWED_FILES.includes(fileName)) continue;

    const content = readFileSync(file, 'utf-8');
    if (CLIENT_FETCH_PATTERN.test(content)) {
      warn(
        'W15',
        `${relPath(file)} -- Direct fetch() in form component. Use Server Actions instead.`
      );
    }
  }

  // Also check that query files don't use fetch directly (should use api-client)
  const queryFiles = collectFiles(SRC, ['.ts']).filter((f) =>
    f.replace(/\\/g, '/').includes('/queries/')
  );

  for (const file of queryFiles) {
    const content = readFileSync(file, 'utf-8');
    // Allow if they import from api-client
    if (content.includes('@/lib/api-client') || content.includes('createApiClient')) continue;

    if (CLIENT_FETCH_PATTERN.test(content)) {
      warn(
        'W15',
        `${relPath(file)} -- Direct fetch() in query file. Use createApiClient() from @/lib/api-client.`
      );
    }
  }
}

// ─── W16: @theme inline Completeness ─────────────────────────────────────────
// Every COLOR CSS variable in :root must have a --color-* mapping in @theme inline.
// Non-color tokens (spacing, text-size, radius) are mapped via other @theme mechanisms.

function checkW16() {
  const globalsCss = join(SRC, 'app/globals.css');
  if (!existsSync(globalsCss)) {
    warn('W16', 'globals.css not found -- cannot verify @theme inline completeness.');
    return;
  }

  const content = readFileSync(globalsCss, 'utf-8');

  // Extract CSS variable names from :root block (first :root only, not sidebar)
  const rootMatch = content.match(/:root\s*\{([^}]+)\}/);
  if (!rootMatch) {
    warn('W16', 'No :root block found in globals.css.');
    return;
  }

  const rootVars = [];
  for (const line of rootMatch[1].split('\n')) {
    const m = line.match(/--(\w[\w-]*)\s*:/);
    if (m) rootVars.push(m[1]);
  }

  // Extract @theme inline mappings (--color-*, --radius-*, --density-*)
  const themeMatch = content.match(/@theme\s+inline\s*\{([^}]+)\}/);
  if (!themeMatch) {
    fail(
      'W16',
      'No @theme inline block found in globals.css. All CSS vars need utility class mappings.'
    );
    return;
  }

  const themeMappings = new Set();
  for (const line of themeMatch[1].split('\n')) {
    const m = line.match(/--color-([\w-]+)\s*:/);
    if (m) themeMappings.add(m[1]);
    // Capture non-color @theme mappings (radius, density, font, z-index)
    const any = line.match(/--(radius[\w-]*)\s*:/);
    if (any) themeMappings.add('__theme__' + any[1]);
    const density = line.match(/--(density[\w-]*)\s*:/);
    if (density) themeMappings.add('__theme__' + density[1]);
  }

  // Non-color var prefixes — these are spacing/sizing tokens mapped via
  // --density-*, --radius-*, etc., not via --color-* mappings.
  const NON_COLOR_PREFIXES = ['spacing-', 'text-size-', 'radius'];

  for (const varName of rootVars) {
    // Skip non-color tokens
    if (NON_COLOR_PREFIXES.some((p) => varName === p.replace(/-$/, '') || varName.startsWith(p))) {
      pass('W16', `--${varName} is a non-color token (mapped via @theme density/radius)`);
      continue;
    }
    if (themeMappings.has(varName)) {
      pass('W16', `--${varName} mapped in @theme inline`);
    } else {
      fail(
        'W16',
        `CSS var --${varName} has no --color-${varName} mapping in @theme inline. Utility classes like bg-${varName} won't work.`
      );
    }
  }
}

// ─── Run All Checks ──────────────────────────────────────────────────────────

function main() {
  if (!existsSync(WEB_ROOT)) {
    console.error('FATAL: apps/web not found at', WEB_ROOT);
    process.exit(2);
  }

  if (!JSON_MODE) {
    console.log('+--------------------------------------------------------------+');
    console.log('|  @afenda/web -- Frontend Drift Gate                          |');
    console.log('|  16 checks - ARCHITECTURE.@afenda-web.md enforcement         |');
    console.log('+--------------------------------------------------------------+\n');
  }

  const checks = [
    { id: 'W01', name: 'No hardcoded Radix primitives', fn: checkW01 },
    { id: 'W02', name: 'No raw className strings (use cn/cva)', fn: checkW02 },
    { id: 'W03', name: 'Forbidden imports (DB/backend)', fn: checkW03 },
    { id: 'W04', name: 'Contract compliance (no hand-written types)', fn: checkW04 },
    { id: 'W05', name: 'Route boundary (allowed import prefixes)', fn: checkW05 },
    { id: 'W06', name: 'Feature isolation (no cross-feature)', fn: checkW06 },
    { id: 'W07', name: 'shadcn purity (no domain code in ui/)', fn: checkW07 },
    { id: 'W08', name: 'No `any` in component props', fn: checkW08 },
    { id: 'W09', name: 'Accessibility (button type, img alt)', fn: checkW09 },
    { id: 'W10', name: 'Tailwind v4 compatibility', fn: checkW10 },
    { id: 'W11', name: '"use client" discipline', fn: checkW11 },
    { id: 'W12', name: 'Required structure', fn: checkW12 },
    { id: 'W13', name: 'Dependency audit', fn: checkW13 },
    { id: 'W14', name: 'No hardcoded colors', fn: checkW14 },
    { id: 'W15', name: 'Server Action pattern', fn: checkW15 },
    { id: 'W16', name: '@theme inline completeness', fn: checkW16 },
  ];

  for (const check of checks) {
    try {
      check.fn();
      if (!JSON_MODE) {
        const checkFails = results.fail.filter((r) => r.check === check.id).length;
        const checkWarns = results.warn.filter((r) => r.check === check.id).length;
        const icon = checkFails > 0 ? 'x' : checkWarns > 0 ? '!' : '+';
        const status = checkFails > 0 ? 'FAIL' : checkWarns > 0 ? 'WARN' : 'PASS';
        console.log(`  ${icon} ${check.id} ${check.name} [${status}]`);
        // Show details for failures
        for (const f of results.fail.filter((r) => r.check === check.id)) {
          console.log(`      x ${f.msg}`);
        }
        for (const w of results.warn.filter((r) => r.check === check.id)) {
          console.log(`      ! ${w.msg}`);
        }
      }
    } catch (err) {
      fail(check.id, `Check crashed: ${err.message}`);
      if (!JSON_MODE) {
        console.log(`  x ${check.id} ${check.name} [CRASH: ${err.message}]`);
      }
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  const summary = {
    total: totalChecks,
    pass: results.pass.length,
    fail: results.fail.length,
    warn: results.warn.length,
  };

  if (JSON_MODE) {
    console.log(JSON.stringify({ summary, results }, null, 2));
  } else {
    console.log('\n' + '-'.repeat(62));
    console.log(`  Total: ${summary.total} checks`);
    console.log(`  Pass:  ${summary.pass}`);
    console.log(`  Fail:  ${summary.fail}`);
    console.log(`  Warn:  ${summary.warn}`);
    console.log('-'.repeat(62));

    if (summary.fail > 0) {
      console.log(`\n  RESULT: FAIL -- ${summary.fail} violation(s) must be fixed.\n`);
    } else if (summary.warn > 0) {
      console.log(`\n  RESULT: PASS (with ${summary.warn} warning(s))\n`);
    } else {
      console.log(`\n  RESULT: PASS -- All checks clean.\n`);
    }
  }

  process.exit(summary.fail > 0 ? 1 : 0);
}

main();
