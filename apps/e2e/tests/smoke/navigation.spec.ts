/**
 * Smoke > Navigation
 *
 * Crawls every authenticated route in the (shell)/ group and asserts:
 *  - Page renders the app shell (#main-content visible, no error boundary)
 *  - No console.error or pageerror on any route (error-monitor fixture)
 *  - Main content area is not blank
 *
 * Routes verified against apps/web/src/app/(shell)/ directory structure.
 * NOTE: /finance/trial-balance is a TOP-LEVEL route (not under /reports/).
 *       /finance/fx-rates is the FX module (not /finance/fx).
 *       /finance/budgets does NOT exist; budget variance is /finance/reports/budget-variance.
 */

import { test, expect } from '../../fixtures/index.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

// All confirmed authenticated routes from apps/web/src/app/(shell)/
const SHELL_ROUTES = [
  { path: '/', label: 'Dashboard' },
  { path: '/finance/journals', label: 'Journals' },
  { path: '/finance/accounts', label: 'Chart of Accounts' },
  { path: '/finance/payables', label: 'Payables' },
  { path: '/finance/receivables', label: 'Receivables' },
  { path: '/finance/recurring', label: 'Recurring Journals' },
  { path: '/finance/periods', label: 'Periods' },
  { path: '/finance/fx-rates', label: 'FX Rates' }, // NOT /finance/fx
  { path: '/finance/intercompany', label: 'Intercompany' },
  { path: '/finance/trial-balance', label: 'Trial Balance' }, // Top-level, not /reports/
  { path: '/finance/reports', label: 'Reports Hub' },
  { path: '/finance/reports/balance-sheet', label: 'Balance Sheet' },
  { path: '/finance/reports/income-statement', label: 'Income Statement' },
  { path: '/finance/reports/cash-flow', label: 'Cash Flow' },
  { path: '/finance/reports/budget-variance', label: 'Budget Variance' },
  { path: '/settings', label: 'Settings' },
];

test.describe('Shell navigation smoke tests', () => {
  for (const { path, label } of SHELL_ROUTES) {
    test(`${label} (${path}) — loads without errors`, async ({ page }) => {
      const shell = new AppShellPage(page);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Shell loaded correctly
      await shell.assertShellLoaded();

      // Not a blank page
      await shell.assertNoBlankMain();
    });
  }

  test('forbidden page renders without errors', async ({ page }) => {
    await page.goto('/forbidden');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('main, [role="main"], body').first().innerText();
    expect(hasContent.trim().length).toBeGreaterThan(10);
  });

  test('not-found page (404) renders correctly', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(body.trim().length).toBeGreaterThan(5);
    // Must not expose a raw error stack trace
    expect(body).not.toMatch(/at Object\.<anonymous>|at Module\.|at eval/);
  });

  test('sidebar navigation link for Journals works', async ({ page }) => {
    const shell = new AppShellPage(page);
    await shell.goto('/');
    await shell.assertShellLoaded();

    // Navigate to Journals via sidebar link
    await shell.navigateTo(/journals/i);
    await expect(page).toHaveURL(/\/finance\/journals/);
    await shell.assertShellLoaded();
  });
});
