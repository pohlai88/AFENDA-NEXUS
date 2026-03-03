/**
 * Finance Dashboard — Bento KPI Deck E2E
 *
 * Validates the bento grid on /finance:
 *  - Key Metrics section renders
 *  - Grid layout loads without errors
 *  - KPI cards or charts visible when configured
 *
 * Global setup creates an org for the test user when needed.
 */

import { test, expect } from '../../fixtures/index.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

test.describe('Finance dashboard bento KPI deck', () => {
  test.beforeEach(async ({ page }) => {
    const shell = new AppShellPage(page);
    await page.goto('/finance', { timeout: 45_000, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await shell.assertShellLoaded();
  });

  test('Key Metrics section is visible', async ({ page }) => {
    await expect(page.getByText('Key Metrics')).toBeVisible({ timeout: 10_000 });
  });

  test('Bento deck container renders', async ({ page }) => {
    const deck = page.getByTestId('bento-kpi-deck');
    await expect(deck).toBeVisible({ timeout: 10_000 });
  });

  test('Bento grid layout is present', async ({ page }) => {
    const grid = page.getByTestId('bento-grid-layout');
    await expect(grid).toBeVisible({ timeout: 10_000 });
  });

  test('Main content is not blank', async ({ page }) => {
    const shell = new AppShellPage(page);
    await shell.assertNoBlankMain();
  });

  test('Domain header bar is visible with configuration options', async ({ page }) => {
    const headerBar = page.getByTestId('dashboard-header-bar');
    await expect(headerBar).toBeVisible({ timeout: 10_000 });
    // View selector (Overview, Cash focus, Executive)
    await expect(page.getByLabel('View', { exact: false })).toBeVisible();
  });

  test('Time range tabs (MTD/QTD/YTD) are present', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'MTD' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: 'QTD' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'YTD' })).toBeVisible();
  });

  test('Compare selector is present', async ({ page }) => {
    await expect(page.getByLabel('Compare', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('Plain language toggle is present', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /plain language/i });
    await expect(toggle).toBeVisible({ timeout: 10_000 });
  });

  test('Plain language toggle swaps KPI card titles', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: /plain language/i });
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    // Capture a known financial-jargon title before toggling
    const totalPayables = page.getByText('Total Payables', { exact: true });
    const accountsPayable = page.getByText('Accounts Payable', { exact: true });
    const hasPayablesTitle = await totalPayables.isVisible().catch(() => false);
    const hasAPTitle = await accountsPayable.isVisible().catch(() => false);

    // At least one AP/Payables KPI should be on the default dashboard
    test.skip(
      !hasPayablesTitle && !hasAPTitle,
      'Neither Total Payables nor Accounts Payable visible on this dashboard config'
    );

    // Toggle ON
    await toggle.click();
    await page.waitForLoadState('networkidle');

    // After toggle, the plain language version should appear
    await expect(page.getByText('Money owed', { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    // Toggle OFF — original title should restore
    await toggle.click();
    await page.waitForLoadState('networkidle');

    if (hasPayablesTitle) {
      await expect(totalPayables).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(accountsPayable).toBeVisible({ timeout: 10_000 });
    }
  });
});
