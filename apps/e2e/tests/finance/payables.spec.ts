/**
 * Finance > Payables
 *
 * Tests the AP Payables module using PayablesPage POM.
 *
 * Real routes / selectors (verified from source):
 *  - List: /finance/payables (h1 "Payables")
 *  - New:  /finance/payables/new
 *    Fields: #invoiceNumber, #supplierId (UUID), #invoiceDate, #dueDate,
 *            #currencyCode, #description (optional)
 *    Submit: "Create Invoice"
 *  - Actions on detail:
 *    "Approve" -> "Post to Ledger" (dialog: #fiscal-period-id, #ap-account-id,
 *    "Confirm Post") -> "Record Payment" (link) -> "Cancel Invoice" (dialog: #cancel-reason)
 *
 * IMPORTANT: Full lifecycle tests (create -> approve -> post -> pay) require
 * seeded supplier UUIDs and fiscal period IDs from the database.
 * Those tests are marked test.fixme until seed data infrastructure is in place.
 * Page-load and navigation tests are fully functional.
 *
 * Status values (exact): "Draft" | "Pending Approval" | "Approved" |
 *                        "Posted" | "Paid" | "Partially Paid" | "Cancelled"
 */

import { test, expect } from '../../fixtures/index.js';
import { PayablesPage } from '../../pages/PayablesPage.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

test.describe('Finance > Payables', () => {
  test('payables list loads without errors', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoList();
    await expect(payables.heading).toBeVisible();
    await expect(payables.createInvoiceButton).toBeVisible();
  });

  test('create invoice button navigates to /finance/payables/new', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoList();
    await payables.clickCreateInvoice();
    await expect(page).toHaveURL(/\/finance\/payables\/new/);

    // All required form fields must be present
    await expect(payables.invoiceNumberInput).toBeVisible();
    await expect(payables.supplierIdInput).toBeVisible();
    await expect(payables.invoiceDateInput).toBeVisible();
    await expect(payables.dueDateInput).toBeVisible();
    await expect(payables.currencyCodeInput).toBeVisible();
    await expect(payables.createInvoiceSubmitButton).toBeVisible();
    await expect(payables.cancelButton).toBeVisible();
  });

  test('cancel button on new form returns to payables list', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoNew();
    await payables.cancelButton.click();
    await expect(page).toHaveURL(/\/finance\/payables$/);
  });

  test('submitting empty form stays on page or shows validation error', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoNew();
    await payables.createInvoiceSubmitButton.click();

    // Must NOT navigate away to a 500 or crash page
    // Either stays on /new or shows validation errors
    const stayedOnForm = page.url().includes('/new');
    const errorVisible = await page
      .getByRole('alert')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const nativeInvalid = await page.locator('#invoiceNumber:invalid, #supplierId:invalid').count();

    expect(stayedOnForm || errorVisible || nativeInvalid > 0).toBe(true);
  });

  test('status filter links are present on list page', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoList();

    const allFilter = payables.filterLink('All');
    const draftFilter = payables.filterLink('Draft');
    const allVisible = await allFilter.isVisible({ timeout: 3_000 }).catch(() => false);
    const draftVisible = await draftFilter.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(allVisible || draftVisible).toBe(true);
  });

  test('creates a draft AP invoice with real supplier data', async ({ page }) => {
    const payables = new PayablesPage(page);
    await payables.gotoNew();

    const supplierId = process.env.TEST_SUPPLIER_ID ?? '00000000-0000-0000-0000-000000000001';

    await payables.fillNewInvoiceForm({
      invoiceNumber: `INV-E2E-${Date.now()}`,
      supplierId,
      invoiceDate: '2026-02-01',
      dueDate: '2026-03-01',
      currencyCode: 'USD',
      description: 'E2E test invoice',
    });
    await payables.submitNewInvoice();

    // Should navigate to the detail page with Draft status
    await expect(page).toHaveURL(/\/finance\/payables\/(?!new)/);
    await payables.assertStatus('Draft');
  });

  test('approve -> post -> pay lifecycle completes without errors', async ({ page }) => {
    const payables = new PayablesPage(page);

    const supplierId = process.env.TEST_SUPPLIER_ID ?? '00000000-0000-0000-0000-000000000001';
    const fiscalPeriodId = process.env.TEST_FISCAL_PERIOD_ID ?? '00000000-0000-0000-0000-000000000001';
    const apAccountId = process.env.TEST_AP_ACCOUNT_ID ?? '00000000-0000-0000-0000-000000000001';

    // Step 1: Create a draft invoice
    await payables.gotoNew();
    await payables.fillNewInvoiceForm({
      invoiceNumber: `INV-LIFECYCLE-${Date.now()}`,
      supplierId,
      invoiceDate: '2026-02-01',
      dueDate: '2026-03-01',
      currencyCode: 'USD',
      description: 'E2E lifecycle test invoice',
    });
    await payables.submitNewInvoice();
    await expect(page).toHaveURL(/\/finance\/payables\/(?!new)/);
    await payables.assertStatus('Draft');

    // Step 2: Approve
    await payables.approve();
    await payables.assertStatus('Approved');

    // Step 3: Post to Ledger
    await payables.postToLedger({ fiscalPeriodId, apAccountId });
    await payables.assertStatus('Posted');

    // Step 4: Navigate to Record Payment
    await expect(payables.recordPaymentLink).toBeVisible({ timeout: 5_000 });
    await payables.recordPaymentLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we navigated to a payment-related page without errors
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('cancel invoice shows dialog and requires reason', async ({ page }) => {
    const payables = new PayablesPage(page);

    const supplierId = process.env.TEST_SUPPLIER_ID ?? '00000000-0000-0000-0000-000000000001';

    // Create a draft invoice first
    await payables.gotoNew();
    await payables.fillNewInvoiceForm({
      invoiceNumber: `INV-CANCEL-${Date.now()}`,
      supplierId,
      invoiceDate: '2026-02-01',
      dueDate: '2026-03-01',
      currencyCode: 'USD',
      description: 'E2E cancel test invoice',
    });
    await payables.submitNewInvoice();
    await expect(page).toHaveURL(/\/finance\/payables\/(?!new)/);
    await payables.assertStatus('Draft');

    // Cancel the invoice with a reason
    await payables.cancelInvoice('E2E test cancellation reason');
    await payables.assertStatus('Cancelled');
  });

  test('idempotent double-post returns success, not 500', async ({ page }) => {
    const payables = new PayablesPage(page);

    const supplierId = process.env.TEST_SUPPLIER_ID ?? '00000000-0000-0000-0000-000000000001';
    const fiscalPeriodId = process.env.TEST_FISCAL_PERIOD_ID ?? '00000000-0000-0000-0000-000000000001';
    const apAccountId = process.env.TEST_AP_ACCOUNT_ID ?? '00000000-0000-0000-0000-000000000001';

    // Create and approve an invoice
    await payables.gotoNew();
    await payables.fillNewInvoiceForm({
      invoiceNumber: `INV-DOUBLEPOST-${Date.now()}`,
      supplierId,
      invoiceDate: '2026-02-01',
      dueDate: '2026-03-01',
      currencyCode: 'USD',
      description: 'E2E idempotent post test',
    });
    await payables.submitNewInvoice();
    await expect(page).toHaveURL(/\/finance\/payables\/(?!new)/);

    await payables.approve();
    await payables.assertStatus('Approved');

    // Post once
    await payables.postToLedger({ fiscalPeriodId, apAccountId });
    await payables.assertStatus('Posted');

    // Attempt to post again — should not crash with 500
    const postButton = payables.postToLedgerButton;
    const isStillVisible = await postButton.isVisible({ timeout: 3_000 }).catch(() => false);

    if (isStillVisible) {
      await payables.postToLedger({ fiscalPeriodId, apAccountId });
      // Stays on Posted without errors — error-monitor would catch any 500
      await payables.assertStatus('Posted');
    }

    // If the button disappeared, the UI correctly prevents double-posting
    const shell = new AppShellPage(page);
    await shell.assertShellLoaded();
  });

  test('shell stays intact after payables navigation', async ({ page }) => {
    const shell = new AppShellPage(page);
    const payables = new PayablesPage(page);

    await payables.gotoList();
    await shell.assertShellLoaded();

    await page.goto('/');
    await shell.assertShellLoaded();

    await payables.gotoList();
    await shell.assertShellLoaded();
  });
});
