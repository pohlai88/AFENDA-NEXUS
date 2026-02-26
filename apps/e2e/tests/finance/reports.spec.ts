/**
 * Finance > Reports
 *
 * Tests the Financial Reports module using ReportsPage POM.
 *
 * IMPORTANT: Reports are separate pages navigated via card links — NOT tabs.
 *
 * Real routes (verified from source):
 *  - Hub:              /finance/reports  (h1 "Financial Reports", 4 card links)
 *  - Trial Balance:    /finance/trial-balance  (TOP-LEVEL — NOT /reports/trial-balance)
 *  - Balance Sheet:    /finance/reports/balance-sheet
 *  - Income Statement: /finance/reports/income-statement
 *  - Cash Flow:        /finance/reports/cash-flow
 *  - Budget Variance:  /finance/reports/budget-variance
 *
 * Data-dependent assertions (assertHasTable) are wrapped in optional checks
 * since reports may show empty state if no financial data has been seeded.
 */

import { test, expect } from '../../fixtures/index.js';
import { ReportsPage } from '../../pages/ReportsPage.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

test.describe('Finance > Reports', () => {
  test('reports hub page loads without errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await expect(reports.heading).toBeVisible();
  });

  test('hub page shows all 4 report card links', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await reports.assertHubCards();
  });

  test('trial balance card navigates to /finance/trial-balance', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await reports.openTrialBalanceFromHub();
    await expect(page).toHaveURL(/\/finance\/trial-balance/);
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('balance sheet card navigates to /finance/reports/balance-sheet', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await reports.openBalanceSheetFromHub();
    await expect(page).toHaveURL(/\/reports\/balance-sheet/);
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('income statement card navigates to /finance/reports/income-statement', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await reports.openIncomeStatementFromHub();
    await expect(page).toHaveURL(/\/reports\/income-statement/);
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('cash flow card navigates to /finance/reports/cash-flow', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoHub();
    await reports.openCashFlowFromHub();
    await expect(page).toHaveURL(/\/reports\/cash-flow/);
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('trial balance page renders without errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoTrialBalance();
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
    await shell.assertNoBlankMain();
  });

  test('balance sheet page renders without errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoBalanceSheet();
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
    await shell.assertNoBlankMain();
  });

  test('income statement page renders without errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoIncomeStatement();
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
    await shell.assertNoBlankMain();
  });

  test('cash flow page renders without errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoCashFlow();
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
    await shell.assertNoBlankMain();
  });

  test('navigating through all report pages does not cause errors', async ({ page }) => {
    const reports = new ReportsPage(page);
    const shell = new AppShellPage(page);

    // Navigate each report page directly — error-monitor catches runtime errors
    await reports.gotoTrialBalance();
    await shell.assertShellLoaded();

    await reports.gotoBalanceSheet();
    await shell.assertShellLoaded();

    await reports.gotoIncomeStatement();
    await shell.assertShellLoaded();

    await reports.gotoCashFlow();
    await shell.assertShellLoaded();

    // Return to hub
    await reports.gotoHub();
    await reports.assertHubCards();
  });

  test('trial balance table has data after seeding transactions', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoTrialBalance();

    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();

    await reports.assertHasTable();
    await reports.assertNoEmptyState();
  });

  test('export from trial balance downloads a file', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.gotoTrialBalance();

    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();

    const filename = await reports.exportAndDownload();
    expect(filename).toMatch(/\.(pdf|csv|xlsx)$/i);
  });
});
