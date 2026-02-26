/**
 * ReportsPage POM
 *
 * Based on apps/web/src/app/(shell)/finance/reports/page.tsx
 *
 * IMPORTANT: Reports are NOT tabs. Each is a separate page navigated via card links.
 *
 * Real routes:
 *  - /finance/reports              -> hub (4 card links)
 *  - /finance/trial-balance        -> Trial Balance (NOT /finance/reports/trial-balance)
 *  - /finance/reports/balance-sheet
 *  - /finance/reports/income-statement
 *  - /finance/reports/cash-flow
 *  - /finance/reports/budget-variance
 *  - /finance/reports/ic-aging
 *
 * Hub page heading: "Financial Reports" (h1)
 * Hub cards navigate via <Link> components (rendered as <a> tags).
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ReportsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Locators: hub page ---

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Financial Reports', level: 1 });
  }

  get trialBalanceCard(): Locator {
    return this.page.getByRole('link', { name: /Trial Balance/ });
  }

  get balanceSheetCard(): Locator {
    return this.page.getByRole('link', { name: /Balance Sheet/ });
  }

  get incomeStatementCard(): Locator {
    return this.page.getByRole('link', { name: /Income Statement/ });
  }

  get cashFlowCard(): Locator {
    return this.page.getByRole('link', { name: /Cash Flow/ });
  }

  // --- Locators: individual report pages ---

  get reportTable(): Locator {
    return this.page.getByRole('table').first();
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /export|download/i }).first();
  }

  // --- Navigation ---

  async gotoHub(): Promise<void> {
    await this.page.goto('/finance/reports');
    await this.page.waitForLoadState('networkidle');
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async gotoTrialBalance(): Promise<void> {
    await this.page.goto('/finance/trial-balance');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoBalanceSheet(): Promise<void> {
    await this.page.goto('/finance/reports/balance-sheet');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoIncomeStatement(): Promise<void> {
    await this.page.goto('/finance/reports/income-statement');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoCashFlow(): Promise<void> {
    await this.page.goto('/finance/reports/cash-flow');
    await this.page.waitForLoadState('networkidle');
  }

  // Navigate via hub card clicks ---

  async openTrialBalanceFromHub(): Promise<void> {
    await this.trialBalanceCard.click();
    await this.page.waitForURL('**/finance/trial-balance');
    await this.page.waitForLoadState('networkidle');
  }

  async openBalanceSheetFromHub(): Promise<void> {
    await this.balanceSheetCard.click();
    await this.page.waitForURL('**/reports/balance-sheet');
    await this.page.waitForLoadState('networkidle');
  }

  async openIncomeStatementFromHub(): Promise<void> {
    await this.incomeStatementCard.click();
    await this.page.waitForURL('**/reports/income-statement');
    await this.page.waitForLoadState('networkidle');
  }

  async openCashFlowFromHub(): Promise<void> {
    await this.cashFlowCard.click();
    await this.page.waitForURL('**/reports/cash-flow');
    await this.page.waitForLoadState('networkidle');
  }

  // --- Assertions ---

  async assertHubCards(): Promise<void> {
    await expect(this.trialBalanceCard).toBeVisible();
    await expect(this.balanceSheetCard).toBeVisible();
    await expect(this.incomeStatementCard).toBeVisible();
    await expect(this.cashFlowCard).toBeVisible();
  }

  async assertHasTable(): Promise<void> {
    await expect(this.reportTable).toBeVisible({ timeout: 15_000 });
    const rows = this.reportTable.getByRole('row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
  }

  async assertNoEmptyState(): Promise<void> {
    await expect(this.page.getByText(/no data|no records|nothing here/i)).toHaveCount(0);
  }

  async exportAndDownload(): Promise<string> {
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30_000 });
    await this.exportButton.click();
    const pdfOption = this.page.getByRole('menuitem', { name: /pdf/i });
    if (await pdfOption.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await pdfOption.click();
    }
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|csv|xlsx)$/i);
    return download.suggestedFilename();
  }
}
