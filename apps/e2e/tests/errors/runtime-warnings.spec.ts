/**
 * Errors > Runtime Warnings
 *
 * Exhaustive error-detection sweep across every authenticated and public route.
 *
 * For each route, the error-monitor fixture (auto:true) automatically detects:
 *  - pageerror (unhandled JS exceptions)
 *  - console.error calls (hard fail)
 *  - HTTP responses with status >= 500 (hard fail)
 *  - React key/hydration/lifecycle warnings (denylist soft fail)
 *
 * Routes are verified against apps/web/src/app/(shell)/ directory.
 * Corrections applied: /finance/fx-rates (NOT /finance/fx)
 *                      /finance/trial-balance is TOP-LEVEL (not /reports/trial-balance)
 *                      /finance/budgets does NOT exist — removed
 */

import { test, expect } from '../../fixtures/index.js';

const AUTHENTICATED_ROUTES = [
  '/',
  '/finance/journals',
  '/finance/accounts',
  '/finance/payables',
  '/finance/receivables',
  '/finance/recurring',
  '/finance/periods',
  '/finance/fx-rates', // NOT /finance/fx
  '/finance/intercompany',
  '/finance/trial-balance', // top-level, NOT /reports/trial-balance
  '/finance/reports',
  '/finance/reports/balance-sheet',
  '/finance/reports/income-statement',
  '/finance/reports/cash-flow',
  '/finance/reports/budget-variance',
  '/settings',
  '/forbidden',
];

const UNAUTHENTICATED_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

test.describe('Runtime error sweep — authenticated routes', () => {
  for (const route of AUTHENTICATED_ROUTES) {
    test(`${route} — zero runtime errors`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });

      // Trigger any lazy-loaded content
      await page.evaluate(() =>
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      );
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo({ top: 0 }));

      // error-monitor fixture (auto:true) will throw if any error captured.
      // Explicit positive assertion: page has rendered some content.
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});

test.describe('Runtime error sweep — public routes', () => {
  test.use({ storageState: undefined });

  for (const route of UNAUTHENTICATED_ROUTES) {
    test(`${route} — zero runtime errors`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
      await page.waitForTimeout(300);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    });
  }
});

test.describe('Runtime error sweep — interactive interactions', () => {
  test('opening and closing create-journal form does not leak errors', async ({ page }) => {
    await page.goto('/finance/journals', { waitUntil: 'networkidle' });

    const createLink = page.getByRole('link', { name: 'Create Journal' });
    if (await createLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await createLink.click();
      await page.waitForLoadState('networkidle');
      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
    // error-monitor handles the assertion
  });

  test('rapid navigation between routes does not produce unhandled rejections', async ({
    page,
  }) => {
    const routes = ['/', '/finance/journals', '/finance/reports', '/finance/payables', '/'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
    }

    await page.waitForLoadState('networkidle');
    // error-monitor will surface any unhandled rejections
  });

  test('browser back/forward navigation does not produce errors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.goto('/finance/journals', { waitUntil: 'networkidle' });
    await page.goto('/finance/reports', { waitUntil: 'networkidle' });

    await page.goBack(); // -> /finance/journals
    await page.waitForLoadState('networkidle');

    await page.goBack(); // -> /
    await page.waitForLoadState('networkidle');

    await page.goForward(); // -> /finance/journals
    await page.waitForLoadState('networkidle');
  });
});
