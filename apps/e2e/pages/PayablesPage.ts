/**
 * PayablesPage POM
 *
 * Based on:
 *  - apps/web/src/app/(shell)/finance/payables/page.tsx
 *  - apps/web/src/app/(shell)/finance/payables/new/page.tsx
 *  - apps/web/src/features/finance/payables/forms/ap-invoice-form.tsx
 *  - apps/web/src/features/finance/payables/blocks/ap-invoice-actions.tsx
 *
 * Exact selectors (no data-testid):
 *  List  /finance/payables
 *  New   /finance/payables/new
 *  Form fields: #invoiceNumber, #supplierId, #invoiceDate, #dueDate,
 *               #currencyCode, #description, #supplierRef, #poRef, #receiptRef
 *  Submit: "Create Invoice"
 *  Actions: "Approve", "Post to Ledger", "Record Payment" (link), "Cancel Invoice"
 *  Post dialog: #fiscal-period-id, #ap-account-id, "Confirm Post"
 *  Cancel dialog: #cancel-reason, "Confirm Cancel"
 *  Statuses: "Draft", "Pending Approval", "Approved", "Posted", "Paid",
 *            "Partially Paid", "Cancelled"
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class PayablesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Locators: list page ---

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Payables', level: 1 });
  }

  get createInvoiceButton(): Locator {
    return this.page.getByRole('link', { name: 'Create Invoice' });
  }

  get emptyStateHeading(): Locator {
    return this.page.getByRole('heading', { name: 'No payable invoices found' });
  }

  filterLink(
    status: 'All' | 'Draft' | 'Pending' | 'Approved' | 'Posted' | 'Paid' | 'Partial' | 'Cancelled'
  ): Locator {
    return this.page.getByRole('link', { name: status, exact: true });
  }

  // --- Locators: new/form page ---

  get invoiceNumberInput(): Locator {
    return this.page.locator('#invoiceNumber');
  }
  get supplierIdInput(): Locator {
    return this.page.locator('#supplierId');
  }
  get invoiceDateInput(): Locator {
    return this.page.locator('#invoiceDate');
  }
  get dueDateInput(): Locator {
    return this.page.locator('#dueDate');
  }
  get currencyCodeInput(): Locator {
    return this.page.locator('#currencyCode');
  }
  get descriptionInput(): Locator {
    return this.page.locator('#description');
  }

  get createInvoiceSubmitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Invoice' });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('link', { name: 'Cancel' });
  }

  // --- Locators: detail/actions ---

  get approveButton(): Locator {
    return this.page.getByRole('button', { name: 'Approve' });
  }

  get postToLedgerButton(): Locator {
    return this.page.getByRole('button', { name: 'Post to Ledger' });
  }

  get recordPaymentLink(): Locator {
    return this.page.getByRole('link', { name: 'Record Payment' });
  }

  get cancelInvoiceButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel Invoice' });
  }

  // Post dialog
  get fiscalPeriodIdInput(): Locator {
    return this.page.locator('#fiscal-period-id');
  }
  get apAccountIdInput(): Locator {
    return this.page.locator('#ap-account-id');
  }
  get confirmPostButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Post' });
  }

  // Cancel dialog
  get cancelReasonInput(): Locator {
    return this.page.locator('#cancel-reason');
  }
  get confirmCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Cancel' });
  }

  // --- Navigation ---

  async gotoList(): Promise<void> {
    await this.page.goto('/finance/payables');
    await this.page.waitForLoadState('networkidle');
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/finance/payables/new');
    await this.page.waitForLoadState('networkidle');
    await expect(this.invoiceNumberInput).toBeVisible({ timeout: 10_000 });
  }

  async clickCreateInvoice(): Promise<void> {
    await this.createInvoiceButton.click();
    await this.page.waitForURL('**/finance/payables/new');
    await expect(this.invoiceNumberInput).toBeVisible({ timeout: 10_000 });
  }

  // --- Form actions ---

  async fillNewInvoiceForm(opts: {
    invoiceNumber: string;
    supplierId: string;
    invoiceDate: string;
    dueDate: string;
    currencyCode?: string;
    description?: string;
  }): Promise<void> {
    await this.invoiceNumberInput.fill(opts.invoiceNumber);
    await this.supplierIdInput.fill(opts.supplierId);
    await this.invoiceDateInput.fill(opts.invoiceDate);
    await this.dueDateInput.fill(opts.dueDate);
    if (opts.currencyCode) await this.currencyCodeInput.fill(opts.currencyCode);
    if (opts.description) await this.descriptionInput.fill(opts.description);
  }

  async submitNewInvoice(): Promise<void> {
    await this.createInvoiceSubmitButton.click();
    await Promise.race([
      this.page.waitForURL('**/finance/payables/**', { timeout: 15_000 }),
      this.page.getByRole('alert').waitFor({ timeout: 5_000 }),
    ]).catch(() => {});
  }

  // --- Detail actions ---

  async approve(): Promise<void> {
    await this.approveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async postToLedger(opts: { fiscalPeriodId: string; apAccountId: string }): Promise<void> {
    await this.postToLedgerButton.click();
    await expect(this.page.getByRole('dialog', { name: 'Post Invoice to Ledger' })).toBeVisible({
      timeout: 5_000,
    });
    await this.fiscalPeriodIdInput.fill(opts.fiscalPeriodId);
    await this.apAccountIdInput.fill(opts.apAccountId);
    await this.confirmPostButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelInvoice(reason: string): Promise<void> {
    await this.cancelInvoiceButton.click();
    await expect(this.page.getByRole('dialog', { name: 'Cancel Invoice' })).toBeVisible({
      timeout: 5_000,
    });
    await this.cancelReasonInput.fill(reason);
    await this.confirmCancelButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // --- Assertions ---

  async assertStatus(
    status:
      | 'Draft'
      | 'Pending Approval'
      | 'Approved'
      | 'Posted'
      | 'Paid'
      | 'Partially Paid'
      | 'Cancelled'
  ): Promise<void> {
    await expect(this.page.getByText(status, { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async assertEmptyState(): Promise<void> {
    await expect(this.emptyStateHeading).toBeVisible({ timeout: 10_000 });
  }

  async assertErrorMessage(text: string | RegExp): Promise<void> {
    await expect(
      this.page.getByRole('alert').or(this.page.locator('[data-sonner-toast]')).first()
    ).toContainText(text, { timeout: 8_000 });
  }
}
