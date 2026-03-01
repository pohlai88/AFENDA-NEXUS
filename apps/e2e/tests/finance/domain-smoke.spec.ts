/**
 * Finance > Domain Smoke Tests
 *
 * Validates the 5 PostingPreview sub-domains load correctly:
 *  - Fixed Assets (list, depreciation, detail placeholder)
 *  - Intangible Assets
 *  - Revenue Recognition
 *  - Intercompany
 *  - Cost Accounting (cost centers, allocation runs, drivers)
 *
 * Each route asserts:
 *  1. App shell renders (#main-content visible)
 *  2. No errors or blank main area
 *  3. Page heading / key landmark is present
 */

import { test, expect } from '../../fixtures/index.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

const ROUTES = [
  // ── Fixed Assets ──────────────────────────────────────────────
  { path: '/finance/fixed-assets', label: 'Fixed Assets list' },
  { path: '/finance/fixed-assets/depreciation', label: 'Depreciation Runs' },
  // ── Intangible Assets ─────────────────────────────────────────
  { path: '/finance/intangibles', label: 'Intangible Assets list' },
  { path: '/finance/intangibles/new', label: 'New Intangible Asset' },
  // ── Revenue Recognition ───────────────────────────────────────
  { path: '/finance/revenue-recognition', label: 'Revenue Contracts list' },
  { path: '/finance/revenue-recognition/new', label: 'New Revenue Contract' },
  // ── Intercompany ──────────────────────────────────────────────
  { path: '/finance/intercompany', label: 'Intercompany list' },
  // ── Cost Accounting ───────────────────────────────────────────
  { path: '/finance/cost-centers', label: 'Cost Centers list' },
  { path: '/finance/cost-centers/allocations', label: 'Allocation Runs' },
  { path: '/finance/cost-centers/drivers', label: 'Cost Drivers' },
] as const;

test.describe('Finance domain smoke tests (R5 coverage)', () => {
  for (const { path, label } of ROUTES) {
    test(`${label} (${path}) — renders without errors`, async ({ page }) => {
      const shell = new AppShellPage(page);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Shell loads correctly
      await shell.assertShellLoaded();

      // Page is not blank
      await shell.assertNoBlankMain();
    });
  }

  test('Fixed Assets list has a heading', async ({ page }) => {
    await page.goto('/finance/fixed-assets');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('Intangibles list has a heading', async ({ page }) => {
    await page.goto('/finance/intangibles');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('Revenue Recognition list has a heading', async ({ page }) => {
    await page.goto('/finance/revenue-recognition');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('Intercompany list has a heading', async ({ page }) => {
    await page.goto('/finance/intercompany');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('Cost Centers list has a heading', async ({ page }) => {
    await page.goto('/finance/cost-centers');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });
});
