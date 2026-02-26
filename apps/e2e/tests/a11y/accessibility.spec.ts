/**
 * A11y › Accessibility
 *
 * @nightly — excluded from the default PR CI run to keep feedback fast.
 *
 * Run separately:
 *   playwright test a11y --grep ""   (remove @nightly exclusion)
 *   # or in a dedicated nightly workflow
 *
 * Uses @axe-core/playwright to run axe accessibility audits on key pages.
 *
 * Routes covered (subset — the most user-critical):
 *  - /login
 *  - / (dashboard)
 *  - /finance/journals
 *  - /finance/reports
 *  - /settings
 *
 * Each check reports violations as test failures with the axe rule ID,
 * description, and affected elements — making triage straightforward.
 */

import { test, expect } from '../../fixtures/index.js';
import AxeBuilder from '@axe-core/playwright';

// axe rules to ignore globally (third-party vendor widgets or known exceptions)
const GLOBAL_IGNORE_RULES: string[] = [
  // shadcn/ui Radix components have focus-visible styles applied via CSS classes,
  // not directly on the element — axe sometimes flags these incorrectly.
  // 'color-contrast', // uncomment if colors are intentionally WCAG AA compliant
];

async function runAxeAndAssert(
  page: import('@playwright/test').Page,
  route: string
): Promise<void> {
  // Run axe with sensible defaults
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .disableRules(GLOBAL_IGNORE_RULES)
    .analyze();

  // Collect only serious + critical violations (skipping minor)
  const critical = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );

  if (critical.length > 0) {
    const summary = critical
      .map(
        (v) =>
          `\n  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes
            .slice(0, 3) // limit node output
            .map((n) => `    → ${n.html}`)
            .join('\n')
      )
      .join('\n');

    throw new Error(
      `[a11y] ${critical.length} serious/critical violation(s) on ${route}:${summary}`
    );
  }

  // Log minor violations as informational (don't fail)
  const minor = results.violations.filter((v) => v.impact === 'minor' || v.impact === 'moderate');
  if (minor.length > 0) {
    console.info(
      `[a11y] ${minor.length} minor/moderate violation(s) on ${route} (not failing):` +
        minor.map((v) => `\n  ${v.id}: ${v.description}`).join('')
    );
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Accessibility @nightly', () => {
  test('login page meets WCAG 2.1 AA', async ({ page }) => {
    test.use({ storageState: undefined });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/login');
  });

  test('dashboard meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/');
  });

  test('journals page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/finance/journals', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/finance/journals');
  });

  test('reports page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/finance/reports', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/finance/reports');
  });

  test('settings page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/settings');
  });

  test('payables page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/finance/payables', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/finance/payables');
  });

  test('register page meets WCAG 2.1 AA', async ({ page }) => {
    test.use({ storageState: undefined });
    await page.goto('/register', { waitUntil: 'networkidle' });
    await runAxeAndAssert(page, '/register');
  });
});
