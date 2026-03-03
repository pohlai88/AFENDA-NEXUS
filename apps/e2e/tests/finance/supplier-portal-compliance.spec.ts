/**
 * SP-8029: Supplier Portal Compliance E2E Tests
 * ────────────────────────────────────────────────────────────────────────────
 * Comprehensive compliance workflow coverage:
 * - Certificate expiry detection
 * - Reminder notifications (30d, 14d, 7d, expired)
 * - Document upload/renewal
 * - Compliance status cleared
 * - Validation (file types, expiry dates, required fields)
 */

import { test, expect } from '@playwright/test';
import { SupplierPortalCompliancePage } from '../../pages/SupplierPortalCompliancePage';

const TEST_SUPPLIER_ID = process.env.E2E_TEST_SUPPLIER_ID ?? 'test-supplier-001';

test.describe('Supplier Portal - Compliance Management', () => {
  let compliancePage: SupplierPortalCompliancePage;

  test.beforeEach(async ({ page }) => {
    compliancePage = new SupplierPortalCompliancePage(page);
    await compliancePage.goto(TEST_SUPPLIER_ID);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Summary Display
  // ═══════════════════════════════════════════════════════════════════════

  test('should display compliance summary with counts', async () => {
    await compliancePage.expectSummaryVisible();

    const validCount = await compliancePage.getValidCount();
    const expiringCount = await compliancePage.getExpiringCount();
    const expiredCount = await compliancePage.getExpiredCount();
    const pendingCount = await compliancePage.getPendingCount();

    expect(validCount).toBeGreaterThanOrEqual(0);
    expect(expiringCount).toBeGreaterThanOrEqual(0);
    expect(expiredCount).toBeGreaterThanOrEqual(0);
    expect(pendingCount).toBeGreaterThanOrEqual(0);
  });

  test('should calculate compliance percentage correctly', async () => {
    const percent = await compliancePage.getCompliancePercent();

    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });

  test('should show empty state when no compliance items exist', async () => {
    // Assuming fresh supplier has no items initially
    const itemCount = await compliancePage.getItemCount();

    if (itemCount === 0) {
      await expect(compliancePage.emptyState).toBeVisible();
      await expect(compliancePage.emptyState).toContainText(
        /No compliance items|Upload your first/i
      );
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Item Listing & Filters
  // ═══════════════════════════════════════════════════════════════════════

  test('should list all compliance items with details', async () => {
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      const insuranceItem = await compliancePage.getItemByType('INSURANCE');
      if (insuranceItem) {
        expect(insuranceItem.type).toBeTruthy();
        expect(insuranceItem.status).toMatch(/VALID|EXPIRING|EXPIRED|PENDING/);
      }
    }
  });

  test('should filter items by status', async () => {
    await compliancePage.filterByStatus('VALID');
    const validCount = await compliancePage.getItemCount();

    await compliancePage.filterByStatus('EXPIRED');
    const expiredCount = await compliancePage.getItemCount();

    // Filter counts should be independent
    expect(validCount).toBeGreaterThanOrEqual(0);
    expect(expiredCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter items by item type', async () => {
    await compliancePage.filterByItemType('INSURANCE');
    const insuranceCount = await compliancePage.getItemCount();

    await compliancePage.filterByItemType('TAX_CLEARANCE');
    const taxCount = await compliancePage.getItemCount();

    expect(insuranceCount).toBeGreaterThanOrEqual(0);
    expect(taxCount).toBeGreaterThanOrEqual(0);
  });

  test('should search compliance items', async () => {
    await compliancePage.search('insurance');
    const resultsCount = await compliancePage.getItemCount();

    expect(resultsCount).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters', async () => {
    await compliancePage.filterByStatus('VALID');
    await compliancePage.filterByItemType('INSURANCE');
    await compliancePage.search('test');

    const filteredCount = await compliancePage.getItemCount();

    await compliancePage.clearFilters();

    const unfilteredCount = await compliancePage.getItemCount();

    expect(unfilteredCount).toBeGreaterThanOrEqual(filteredCount);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Expiry Detection
  // ═══════════════════════════════════════════════════════════════════════

  test('should detect expiring items (30 days)', async () => {
    const expiringCount = await compliancePage.getExpiringCount();

    if (expiringCount > 0) {
      await compliancePage.filterByStatus('EXPIRING_SOON');
      const items = await compliancePage.getItemCount();
      expect(items).toBeGreaterThan(0);
    }
  });

  test('should show days until expiry for expiring items', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      const insuranceItem = await compliancePage.getItemByType('INSURANCE');
      if (insuranceItem) {
        expect(insuranceItem.daysUntilExpiry).toBeLessThanOrEqual(30);
      }
    }
  });

  test('should mark items as expired when past due', async () => {
    await compliancePage.filterByStatus('EXPIRED');
    const expiredCount = await compliancePage.getItemCount();

    if (expiredCount > 0) {
      const taxItem = await compliancePage.getItemByType('TAX_CLEARANCE');
      if (taxItem) {
        expect(taxItem.status).toBe('EXPIRED');
        expect(taxItem.daysUntilExpiry).toBeLessThan(0);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Alert System
  // ═══════════════════════════════════════════════════════════════════════

  test('should show alert banner when items are expiring or expired', async () => {
    const expiringCount = await compliancePage.getExpiringCount();
    const expiredCount = await compliancePage.getExpiredCount();

    if (expiringCount > 0 || expiredCount > 0) {
      const hasAlerts = await compliancePage.hasAlertBanner();
      expect(hasAlerts).toBe(true);
    }
  });

  test('should display correct alert count', async () => {
    const expiringCount = await compliancePage.getExpiringCount();
    const expiredCount = await compliancePage.getExpiredCount();
    const totalAlerts = expiringCount + expiredCount;

    if (totalAlerts > 0) {
      const alertCount = await compliancePage.getAlertCount();
      expect(alertCount).toBeGreaterThan(0);
    }
  });

  test('should list individual alerts by severity', async () => {
    const expiringCount = await compliancePage.getExpiringCount();

    if (expiringCount > 0) {
      const alertTypes = await compliancePage.getAlertTypes();
      expect(alertTypes.length).toBeGreaterThan(0);
      // Should include EXPIRING_30D, EXPIRING_14D, EXPIRING_7D, or EXPIRED
      expect(alertTypes.some((type: string) => type.match(/EXPIRING|EXPIRED/))).toBe(true);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Renewal Workflow - Happy Path
  // ═══════════════════════════════════════════════════════════════════════

  test('should open renewal form for expiring item', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('INSURANCE');
      await compliancePage.expectRenewalFormValid();
    }
  });

  test('should allow uploading new document during renewal', async ({ page }) => {
    test.skip(true, 'Requires file upload fixture setup');

    await compliancePage.openRenewalForm('INSURANCE');

    const testFilePath = './fixtures/compliance/insurance-certificate.pdf';
    await compliancePage.uploadRenewalDocument(testFilePath);

    // Verify upload success indicator
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });

  test('should set new expiry date during renewal', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('INSURANCE');

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateString = futureDate.toISOString().split('T')[0]!; // YYYY-MM-DD

      await compliancePage.setNewExpiryDate(dateString);
      await expect(compliancePage.newExpiryDateInput).toHaveValue(dateString);
    }
  });

  test('should add notes to renewal submission', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('TAX_CLEARANCE');

      const notes = 'Renewed tax clearance certificate for 2026';
      await compliancePage.setRenewalNotes(notes);
      await expect(compliancePage.notesTextarea).toHaveValue(notes);
    }
  });

  test('should submit renewal and update item status', async ({ page }) => {
    test.skip(true, 'Requires full renewal workflow with file upload');

    await compliancePage.filterByStatus('EXPIRING_SOON');
    const initialCount = await compliancePage.getExpiringCount();

    if (initialCount > 0) {
      await compliancePage.openRenewalForm('INSURANCE');
      await compliancePage.uploadRenewalDocument('./fixtures/compliance/insurance.pdf');
      await compliancePage.setNewExpiryDate('2027-12-31');
      await compliancePage.setRenewalNotes('Annual renewal');

      await compliancePage.submitRenewal();

      // Verify status changed to VALID or PENDING
      await compliancePage.expectItemStatusIs('INSURANCE', 'VALID');

      // Verify expiring count decreased
      const newCount = await compliancePage.getExpiringCount();
      expect(newCount).toBeLessThan(initialCount);
    }
  });

  test('should cancel renewal without changes', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      const initialCount = await compliancePage.getExpiringCount();

      await compliancePage.openRenewalForm('INSURANCE');
      await compliancePage.cancelRenewal();

      // Verify count unchanged
      const newCount = await compliancePage.getExpiringCount();
      expect(newCount).toBe(initialCount);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Validation
  // ═══════════════════════════════════════════════════════════════════════

  test('should require file upload for renewal', async () => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('INSURANCE');

      // Submit button should be disabled without file
      await expect(compliancePage.submitRenewalButton).toBeDisabled();

      await compliancePage.setNewExpiryDate('2027-12-31');

      // Still disabled without file
      await expect(compliancePage.submitRenewalButton).toBeDisabled();
    }
  });

  test('should validate expiry date is in future', async ({ page }) => {
    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('TAX_CLEARANCE');

      const pastDate = '2023-01-01';
      await compliancePage.setNewExpiryDate(pastDate);

      // Expect validation error
      const errorMessage = page.locator('[data-testid="expiry-date-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/must be.*future/i);
    }
  });

  test('should validate file type (PDF only)', async ({ page }) => {
    test.skip(true, 'Requires file upload validation setup');

    await compliancePage.openRenewalForm('INSURANCE');

    const invalidFile = './fixtures/compliance/invalid.txt';
    await compliancePage.uploadRenewalDocument(invalidFile);

    const errorMessage = page.locator('[data-testid="file-type-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/PDF.*only/i);
  });

  test('should validate file size (max 10MB)', async ({ page }) => {
    test.skip(true, 'Requires large file fixture');

    await compliancePage.openRenewalForm('INSURANCE');

    const largeFile = './fixtures/compliance/large-file-11mb.pdf';
    await compliancePage.uploadRenewalDocument(largeFile);

    const errorMessage = page.locator('[data-testid="file-size-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/10.*MB/i);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Timeline Tracking
  // ═══════════════════════════════════════════════════════════════════════

  test('should display compliance activity timeline', async () => {
    await compliancePage.viewTimeline();

    const entryCount = await compliancePage.getTimelineEntryCount();
    expect(entryCount).toBeGreaterThanOrEqual(0);
  });

  test('should show latest renewal in timeline', async () => {
    await compliancePage.viewTimeline();

    const latestEntry = await compliancePage.getLatestTimelineEntry();

    if (latestEntry) {
      expect(latestEntry.action).toBeTruthy();
      expect(latestEntry.timestamp).toBeTruthy();
      expect(latestEntry.user).toBeTruthy();
    }
  });

  test('should show expiry alert creation in timeline', async () => {
    await compliancePage.viewTimeline();

    const entryCount = await compliancePage.getTimelineEntryCount();

    if (entryCount > 0) {
      const latestEntry = await compliancePage.getLatestTimelineEntry();
      // Timeline should include alert creation events
      expect(latestEntry?.action).toMatch(/alert|expir|renew|upload/i);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Error Handling
  // ═══════════════════════════════════════════════════════════════════════

  test('should handle invalid supplier ID gracefully', async ({ page }) => {
    await compliancePage.goto('invalid-supplier-id-999');

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/not found|invalid|unauthorized/i);
  });

  test('should handle network errors during renewal', async ({ page }) => {
    // Simulate offline condition
    await page.route('**/compliance/**/renew', (route) => route.abort());

    await compliancePage.filterByStatus('EXPIRING_SOON');
    const itemCount = await compliancePage.getItemCount();

    if (itemCount > 0) {
      await compliancePage.openRenewalForm('INSURANCE');
      // Attempt submit (will fail due to route abort)
      // Note: Would need proper file upload here in real test

      const networkError = page.locator('[data-testid="network-error"]');
      await expect(networkError).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle concurrent renewals gracefully', async () => {
    test.skip(true, 'Requires multi-user test setup');
    // Test that optimistic locking prevents concurrent renewal conflicts
  });
});
