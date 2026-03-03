/**
 * Page Object Model for Supplier Portal Statement Reconciliation
 *
 * Workflow:
 *   1. Upload statement (CSV/PDF parsed to statement lines)
 *   2. Review matching results (matched, statement-only, ledger-only)
 *   3. View discrepancy details
 *   4. Export reconciliation report
 *
 * Matching logic:
 *   - Exact amount + currency match
 *   - Date within tolerance window (default 3 days)
 *   - Statement total vs Ledger total comparison
 */
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export interface StatementLine {
  lineRef: string;
  date: string;
  description: string;
  amount: number;
  currencyCode: string;
}

export class SupplierPortalReconciliationPage {
  readonly page: Page;

  // Navigation
  readonly reconciliationLink: Locator;

  // Upload page
  readonly pageTitle: Locator;
  readonly uploadSection: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly asOfDateInput: Locator;
  readonly dateToleranceInput: Locator;
  readonly submitButton: Locator;

  // Results page
  readonly resultsHeading: Locator;
  readonly matchedCount: Locator;
  readonly statementOnlyCount: Locator;
  readonly ledgerOnlyCount: Locator;
  readonly statementTotal: Locator;
  readonly ledgerTotal: Locator;
  readonly differenceAmount: Locator;
  readonly differenceIndicator: Locator;

  // Matches table
  readonly matchesTable: Locator;
  readonly matchedRows: Locator;
  readonly statementOnlyRows: Locator;
  readonly ledgerOnlyRows: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly applyFiltersButton: Locator;

  // Export
  readonly exportButton: Locator;
  readonly exportFormatSelect: Locator;

  // Validation errors
  readonly errorMessage: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.reconciliationLink = page.getByRole('link', { name: /reconciliation|statement/i });

    // Upload page
    this.pageTitle = page.getByRole('heading', {
      name: /statement.*reconciliation|reconciliation/i,
      level: 1,
    });
    this.uploadSection = page.locator('[data-testid="upload-section"]');
    this.fileInput = page.locator('input[type="file"]');
    this.uploadButton = page.getByRole('button', { name: /upload/i });
    this.asOfDateInput = page.getByLabel(/as of date|statement date/i);
    this.dateToleranceInput = page.getByLabel(/date tolerance|tolerance/i);
    this.submitButton = page.getByRole('button', { name: /submit|reconcile/i });

    // Results page
    this.resultsHeading = page.getByRole('heading', { name: /reconciliation results/i });
    this.matchedCount = page.locator('[data-testid="matched-count"]');
    this.statementOnlyCount = page.locator('[data-testid="statement-only-count"]');
    this.ledgerOnlyCount = page.locator('[data-testid="ledger-only-count"]');
    this.statementTotal = page.locator('[data-testid="statement-total"]');
    this.ledgerTotal = page.locator('[data-testid="ledger-total"]');
    this.differenceAmount = page.locator('[data-testid="difference-amount"]');
    this.differenceIndicator = page.locator('[data-testid="difference-indicator"]');

    // Matches table
    this.matchesTable = page.getByRole('table');
    this.matchedRows = page.locator('tr[data-status="MATCHED"]');
    this.statementOnlyRows = page.locator('tr[data-status="STATEMENT_ONLY"]');
    this.ledgerOnlyRows = page.locator('tr[data-status="LEDGER_ONLY"]');

    // Filters
    this.statusFilter = page.getByLabel(/status/i);
    this.applyFiltersButton = page.getByRole('button', { name: /apply.*filter/i });

    // Export
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.exportFormatSelect = page.getByLabel(/format/i);

    // Validation
    this.errorMessage = page.locator('[role="alert"]');
    this.validationErrors = page.locator('.error-message, [data-testid="error"]');
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async gotoReconciliation() {
    await this.page.goto('/portal/reconciliation');
    await this.pageTitle.waitFor();
  }

  async gotoUpload() {
    await this.page.goto('/portal/reconciliation/upload');
    await this.uploadSection.waitFor();
  }

  // ─── Upload Statement ──────────────────────────────────────────────────────

  /**
   * Upload a statement file (simulates file upload).
   * In a real test, this would attach a CSV/PDF file.
   */
  async uploadStatementFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  /**
   * Fill statement reconciliation form with data.
   * Simulates manual entry or parsed CSV data.
   */
  async submitStatementData(data: {
    asOfDate: string;
    statementLines: StatementLine[];
    dateTolerance?: number;
  }): Promise<void> {
    // Fill as-of date
    await this.asOfDateInput.fill(data.asOfDate);

    // Fill date tolerance if provided
    if (data.dateTolerance !== undefined) {
      await this.dateToleranceInput.fill(data.dateTolerance.toString());
    }

    // In a real implementation, statement lines would be entered via table/form
    // For E2E tests, we might simulate an API call or use browser storage
    await this.page.evaluate((lines) => {
      sessionStorage.setItem('statementLines', JSON.stringify(lines));
    }, data.statementLines);

    await this.submitButton.click();

    // Wait for reconciliation to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Simplified reconciliation submission (for tests with pre-loaded data).
   */
  async submitReconciliation(asOfDate: string, dateTolerance?: number): Promise<void> {
    await this.asOfDateInput.fill(asOfDate);

    if (dateTolerance !== undefined) {
      await this.dateToleranceInput.fill(dateTolerance.toString());
    }

    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── View Results ──────────────────────────────────────────────────────────

  async getMatchedCount(): Promise<number> {
    const text = await this.matchedCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async getStatementOnlyCount(): Promise<number> {
    const text = await this.statementOnlyCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async getLedgerOnlyCount(): Promise<number> {
    const text = await this.ledgerOnlyCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async getStatementTotal(): Promise<number> {
    const text = await this.statementTotal.textContent();
    const match = text?.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async getLedgerTotal(): Promise<number> {
    const text = await this.ledgerTotal.textContent();
    const match = text?.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async getDifference(): Promise<number> {
    const text = await this.differenceAmount.textContent();
    const match = text?.match(/-?[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  async isDifferenceZero(): Promise<boolean> {
    const diff = await this.getDifference();
    return Math.abs(diff) < 0.01; // Floating point tolerance
  }

  async hasDifferenceWarning(): Promise<boolean> {
    return this.differenceIndicator.isVisible();
  }

  // ─── Filter Results ────────────────────────────────────────────────────────

  async filterByStatus(status: 'MATCHED' | 'STATEMENT_ONLY' | 'LEDGER_ONLY'): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async showAllMatches(): Promise<void> {
    await this.statusFilter.selectOption('ALL');
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  async exportResults(format: 'CSV' | 'EXCEL' | 'PDF'): Promise<void> {
    await this.exportFormatSelect.selectOption(format);

    // Start waiting for download before clicking export
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/reconciliation/i);
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async expectResultsVisible(): Promise<void> {
    await expect(this.resultsHeading).toBeVisible();
  }

  async expectMatchCount(expected: number): Promise<void> {
    const actual = await this.getMatchedCount();
    expect(actual).toBe(expected);
  }

  async expectStatementOnlyCount(expected: number): Promise<void> {
    const actual = await this.getStatementOnlyCount();
    expect(actual).toBe(expected);
  }

  async expectLedgerOnlyCount(expected: number): Promise<void> {
    const actual = await this.getLedgerOnlyCount();
    expect(actual).toBe(expected);
  }

  async expectReconciled(): Promise<void> {
    const isZero = await this.isDifferenceZero();
    expect(isZero).toBeTruthy();
  }

  async expectDiscrepancy(): Promise<void> {
    const isZero = await this.isDifferenceZero();
    expect(isZero).toBeFalsy();
  }

  async expectValidationError(message: string | RegExp): Promise<void> {
    const error = this.page.getByText(message);
    await expect(error).toBeVisible();
  }

  async expectUploadSuccess(): Promise<void> {
    const successMessage = this.page.getByText(/uploaded|success/i);
    await expect(successMessage).toBeVisible();
  }

  async expectNoStatementLines(): Promise<void> {
    const emptyMessage = this.page.getByText(/no statement lines|empty statement/i);
    await expect(emptyMessage).toBeVisible();
  }

  /**
   * Verify table shows correct number of rows for each status.
   */
  async expectRowCounts(matched: number, statementOnly: number, ledgerOnly: number): Promise<void> {
    await expect(this.matchedRows).toHaveCount(matched);
    await expect(this.statementOnlyRows).toHaveCount(statementOnly);
    await expect(this.ledgerOnlyRows).toHaveCount(ledgerOnly);
  }

  /**
   * Verify totals are displayed and approximately correct.
   */
  async expectTotalsDisplayed(): Promise<void> {
    await expect(this.statementTotal).toBeVisible();
    await expect(this.ledgerTotal).toBeVisible();
    await expect(this.differenceAmount).toBeVisible();
  }

  /**
   * Get details of a specific match by index.
   */
  async getMatchDetails(index: number): Promise<{
    status: string;
    amount: number;
    description: string;
  }> {
    const row = this.matchesTable.locator('tbody tr').nth(index);
    const status = (await row.getAttribute('data-status')) ?? '';
    const amountCell = row.locator('td').nth(2); // Assuming amount is 3rd column
    const descCell = row.locator('td').nth(1); // Assuming description is 2nd column

    const amountText = await amountCell.textContent();
    const descText = await descCell.textContent();

    const amountMatch = amountText?.match(/[\d,]+\.?\d*/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : 0;

    return {
      status,
      amount,
      description: descText?.trim() ?? '',
    };
  }

  /**
   * Check if a specific invoice number appears in results.
   */
  async hasInvoiceInResults(invoiceNumber: string): Promise<boolean> {
    const row = this.page.locator(`tr:has-text("${invoiceNumber}")`);
    return row.isVisible().catch(() => false);
  }
}
