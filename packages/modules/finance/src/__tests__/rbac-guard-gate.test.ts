/**
 * GAP-A1 CI Gate: Ensures every write route (POST/PUT/PATCH/DELETE)
 * in the finance module has a requirePermission preHandler guard.
 *
 * Scans all *-routes.ts files for app.post/put/patch/delete calls
 * and asserts that each one includes a preHandler with requirePermission.
 *
 * This prevents accidental introduction of unguarded write endpoints.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SLICES_DIR = path.resolve(__dirname, '..', 'slices');

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(full));
    } else if (entry.name.endsWith('-routes.ts')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract write route calls from file content.
 * Matches patterns like:
 *   app.post('/path', { preHandler: ... }, async ...
 *   app.post('/path', async ...
 *   app.post<...>('/path', { preHandler: ... }, async ...
 */
function extractWriteRoutes(
  content: string
): { line: number; text: string; path: string | null; hasGuard: boolean }[] {
  const lines = content.split('\n');
  const results: { line: number; text: string; path: string | null; hasGuard: boolean }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Match app.post, app.put, app.patch, app.delete (with optional generic type param)
    const match = line.match(/app\.(post|put|patch|delete)(<[^>]*>)?\s*\(/);
    if (!match) continue;

    // Extract route path (first string literal after method call)
    const pathMatch = line.match(
      /app\.(post|put|patch|delete)(?:<[^>]*>)?\s*\(\s*['"]([^'"]+)['"]/
    );
    const routePath = pathMatch ? pathMatch[2] : null;

    // Look at this line and the next lines to find the preHandler (multi-line config blocks)
    const context = lines.slice(i, Math.min(i + 12, lines.length)).join(' ');
    const hasGuard = context.includes('requirePermission') || context.includes('requireSoD');

    results.push({
      line: i + 1,
      text: line.trim(),
      path: routePath,
      hasGuard,
    });
  }

  return results;
}

describe('RBAC Guard Gate — CI enforcement', () => {
  const routeFiles = findRouteFiles(SLICES_DIR);

  it('should find route files', () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(42);
  });

  it('every route file should accept IAuthorizationPolicy parameter', () => {
    const missing: string[] = [];
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('IAuthorizationPolicy')) {
        missing.push(path.relative(SLICES_DIR, file));
      }
    }
    expect(missing).toEqual([]);
  });

  it('every write route (POST/PUT/PATCH/DELETE) must have a requirePermission guard', () => {
    const violations: string[] = [];

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const routes = extractWriteRoutes(content);
      // Exclude public routes (paths starting with /public/) - these are intentionally unguarded
      const unguarded = routes.filter(
        (r) => !r.hasGuard && (!r.path || !r.path.startsWith('/public/'))
      );

      for (const route of unguarded) {
        violations.push(`${path.relative(SLICES_DIR, file)}:${route.line} — ${route.text}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} unguarded write route(s):\n${violations.join('\n')}`
      );
    }
  });

  it('every route file should import requirePermission from authorization-guard', () => {
    const missing: string[] = [];
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('requirePermission')) {
        missing.push(path.relative(SLICES_DIR, file));
      }
    }
    expect(missing).toEqual([]);
  });

  it('SoD-relevant routes must have requireSoD guard', () => {
    const SOD_ROUTES = [
      { file: 'gl/routes/journal-routes.ts', pattern: "'/journals/:id/post'", sod: 'journal:post' },
      {
        file: 'gl/routes/journal-routes.ts',
        pattern: "'/journals/:id/reverse'",
        sod: 'journal:reverse',
      },
      { file: 'gl/routes/period-routes.ts', pattern: "'/periods/:id/close'", sod: 'period:close' },
      {
        file: 'gl/routes/period-routes.ts',
        pattern: "'/periods/:id/reopen'",
        sod: 'period:reopen',
      },
    ];

    const violations: string[] = [];
    for (const rule of SOD_ROUTES) {
      const file = routeFiles.find((f) => f.replace(/\\/g, '/').endsWith(rule.file));
      if (!file) {
        violations.push(`${rule.file} — route file not found`);
        continue;
      }
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i]!.includes(rule.pattern)) continue;
        const context = lines.slice(i, Math.min(i + 12, lines.length)).join(' ');
        if (!context.includes('requireSoD')) {
          violations.push(
            `${rule.file}:${i + 1} — route ${rule.pattern} missing requireSoD for ${rule.sod}`
          );
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(`SoD-relevant routes missing requireSoD guard:\n${violations.join('\n')}`);
    }
  });
});
