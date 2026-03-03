/**
 * SP-8029: Supplier Portal Compliance Page Object Model
 * ────────────────────────────────────────────────────────────────────────────
 * Handles compliance workflow:
 * - Certificate expiry detection
 * - Reminder notifications
 * - Document upload/renewal
 * - Compliance status tracking
 */

import { type Page, type Locator, expect } from '@playwright/test';

export type ComplianceStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING' | 'NOT_SUBMITTED';
export type ComplianceItemType = 'INSURANCE' | 'TAX_CLEARANCE' | 'CERTIFICATE_OF_INCORPORATION';
export type AlertType = 'EXPIRING_30D' | 'EXPIRING_14D' | 'EXPIRING_7D' | 'EXPIRED';

export class SupplierPortalCompliancePage {
  readonly page: Page;

  // ─── Locators: Summary Page ────────────────────────────────────────────
  readonly summaryContainer: Locator;
  readonly validCountBadge: Locator;
  readonly expiringCountBadge: Locator;
  readonly expiredCountBadge: Locator;
  readonly pendingCountBadge: Locator;
  readonly compliancePercent: Locator;

  // ─── Locators: Compliance Items List ───────────────────────────────────
  readonly itemsTable: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;

  // ─── Locators: Filters ──────────────────────────────────────────────────
  readonly statusFilter: Locator;
  readonly itemTypeFilter: Locator;
  readonly searchInput: Locator;

  // ─── Locators: Renewal Form ────────────────────────────────────────────
  readonly renewButton: (itemType: string) => Locator;
  readonly renewModal: Locator;
  readonly fileUploadInput: Locator;
  readonly newExpiryDateInput: Locator;
  readonly notesTextarea: Locator;
  readonly submitRenewalButton: Locator;
  readonly cancelRenewalButton: Locator;

  // ─── Locators: Alerts/Timeline ─────────────────────────────────────────
  readonly alertBanner: Locator;
  readonly alertCount: Locator;
  readonly viewAlertsButton: Locator;
  readonly alertsList: Locator;
  readonly timelineButton: Locator;
  readonly timelineEntries: Locator;

  // ─── Locators: Detail View ─────────────────────────────────────────────
  readonly detailPanel: Locator;
  readonly documentPreview: Locator;
  readonly downloadDocumentButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Summary
    this.summaryContainer = page.locator('[data-testid="compliance-summary"]');
    this.validCountBadge = page.locator('[data-testid="compliance-valid-count"]');
    this.expiringCountBadge = page.locator('[data-testid="compliance-expiring-count"]');
    this.expiredCountBadge = page.locator('[data-testid="compliance-expired-count"]');
    this.pendingCountBadge = page.locator('[data-testid="compliance-pending-count"]');
    this.compliancePercent = page.locator('[data-testid="compliance-percent"]');

    // Items table
    this.itemsTable = page.locator('[data-testid="compliance-items-table"]');
    this.tableRows = this.itemsTable.locator('tbody tr');
    this.emptyState = page.locator('[data-testid="compliance-empty-state"]');

    // Filters
    this.statusFilter = page.locator('[data-testid="compliance-status-filter"]');
    this.itemTypeFilter = page.locator('[data-testid="compliance-item-type-filter"]');
    this.searchInput = page.locator('[data-testid="compliance-search"]');

    // Renewal form
    this.renewButton = (itemType: string) =>
      page.locator(`[data-testid="renew-${itemType.toLowerCase().replace(/_/g, '-')}"]`);
    this.renewModal = page.locator('[data-testid="renewal-modal"]');
    this.fileUploadInput = page.locator('[data-testid="renewal-file-upload"]');
    this.newExpiryDateInput = page.locator('[data-testid="renewal-expiry-date"]');
    this.notesTextarea = page.locator('[data-testid="renewal-notes"]');
    this.submitRenewalButton = page.locator('[data-testid="submit-renewal"]');
    this.cancelRenewalButton = page.locator('[data-testid="cancel-renewal"]');

    // Alerts/Timeline
    this.alertBanner = page.locator('[data-testid="compliance-alert-banner"]');
    this.alertCount = page.locator('[data-testid="alert-count"]');
    this.viewAlertsButton = page.locator('[data-testid="view-alerts"]');
    this.alertsList = page.locator('[data-testid="alerts-list"]');
    this.timelineButton = page.locator('[data-testid="view-timeline"]');
    this.timelineEntries = page.locator('[data-testid="timeline-entries"] > div');

    // Detail view
    this.detailPanel = page.locator('[data-testid="compliance-item-detail"]');
    this.documentPreview = page.locator('[data-testid="document-preview"]');
    this.downloadDocumentButton = page.locator('[data-testid="download-document"]');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════

  async goto(supplierId: string): Promise<void> {
    await this.page.goto(`/portal/suppliers/${supplierId}/compliance`);
    await this.page.waitForLoadState('networkidle');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Summary Queries
  // ═══════════════════════════════════════════════════════════════════════

  async getCompliancePercent(): Promise<number> {
    const text = await this.compliancePercent.textContent();
    return parseInt(text?.replace('%', '') ?? '0', 10);
  }

  async getValidCount(): Promise<number> {
    const text = await this.validCountBadge.textContent();
    return parseInt(text ?? '0', 10);
  }

  async getExpiringCount(): Promise<number> {
    const text = await this.expiringCountBadge.textContent();
    return parseInt(text ?? '0', 10);
  }

  async getExpiredCount(): Promise<number> {
    const text = await this.expiredCountBadge.textContent();
    return parseInt(text ?? '0', 10);
  }

  async getPendingCount(): Promise<number> {
    const text = await this.pendingCountBadge.textContent();
    return parseInt(text ?? '0', 10);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // List Operations
  // ═══════════════════════════════════════════════════════════════════════

  async getItemCount(): Promise<number> {
    if (await this.emptyState.isVisible()) {
      return 0;
    }
    return await this.tableRows.count();
  }

  async getItemByType(itemType: ComplianceItemType): Promise<{
    type: string;
    status: string;
    expiryDate: string | null;
    daysUntilExpiry: number | null;
  } | null> {
    const rowCount = await this.tableRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const typeCell = row.locator('td').nth(0);
      const typeText = await typeCell.textContent();
      if (typeText?.includes(itemType)) {
        const statusCell = row.locator('td').nth(1);
        const expiryCell = row.locator('td').nth(2);
        const daysCell = row.locator('td').nth(3);

        return {
          type: typeText.trim(),
          status: (await statusCell.textContent())?.trim() ?? '',
          expiryDate: await expiryCell.textContent(),
          daysUntilExpiry: (await daysCell.isVisible())
            ? parseInt((await daysCell.textContent()) ?? '0', 10)
            : null,
        };
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Filter Operations
  // ═══════════════════════════════════════════════════════════════════════

  async filterByStatus(status: ComplianceStatus): Promise<void> {
    await this.statusFilter.selectOption({ value: status });
    await this.page.waitForLoadState('networkidle');
  }

  async filterByItemType(itemType: ComplianceItemType): Promise<void> {
    await this.itemTypeFilter.selectOption({ value: itemType });
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce search
    await this.page.waitForLoadState('networkidle');
  }

  async clearFilters(): Promise<void> {
    await this.statusFilter.selectOption({ value: '' });
    await this.itemTypeFilter.selectOption({ value: '' });
    await this.searchInput.clear();
    await this.page.waitForLoadState('networkidle');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Renewal Workflow
  // ═══════════════════════════════════════════════════════════════════════

  async openRenewalForm(itemType: ComplianceItemType): Promise<void> {
    await this.renewButton(itemType).click();
    await expect(this.renewModal).toBeVisible();
  }

  async uploadRenewalDocument(filePath: string): Promise<void> {
    await this.fileUploadInput.setInputFiles(filePath);
    // Wait for upload/preview
    await this.page.waitForTimeout(100);
  }

  async setNewExpiryDate(date: string): Promise<void> {
    await this.newExpiryDateInput.fill(date);
  }

  async setRenewalNotes(notes: string): Promise<void> {
    await this.notesTextarea.fill(notes);
  }

  async submitRenewal(): Promise<void> {
    await this.submitRenewalButton.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.renewModal).not.toBeVisible();
  }

  async cancelRenewal(): Promise<void> {
    await this.cancelRenewalButton.click();
    await expect(this.renewModal).not.toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Alerts Workflow
  // ═══════════════════════════════════════════════════════════════════════

  async hasAlertBanner(): Promise<boolean> {
    return await this.alertBanner.isVisible();
  }

  async getAlertCount(): Promise<number> {
    const text = await this.alertCount.textContent();
    return parseInt(text ?? '0', 10);
  }

  async viewAlerts(): Promise<void> {
    await this.viewAlertsButton.click();
    await expect(this.alertsList).toBeVisible();
  }

  async getAlertTypes(): Promise<string[]> {
    await this.viewAlerts();
    const alerts = this.alertsList.locator('[data-testid="alert-item"]');
    const count = await alerts.count();
    const types: string[] = [];
    for (let i = 0; i < count; i++) {
      const typeElement = alerts.nth(i).locator('[data-testid="alert-type"]');
      const type = await typeElement.textContent();
      if (type) types.push(type.trim());
    }
    return types;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Timeline Operations
  // ═══════════════════════════════════════════════════════════════════════

  async viewTimeline(): Promise<void> {
    await this.timelineButton.click();
    await expect(this.timelineEntries.first()).toBeVisible();
  }

  async getTimelineEntryCount(): Promise<number> {
    return await this.timelineEntries.count();
  }

  async getLatestTimelineEntry(): Promise<{
    action: string;
    timestamp: string;
    user: string;
  } | null> {
    if ((await this.timelineEntries.count()) === 0) return null;

    const firstEntry = this.timelineEntries.first();
    const action = await firstEntry.locator('[data-testid="timeline-action"]').textContent();
    const timestamp = await firstEntry.locator('[data-testid="timeline-timestamp"]').textContent();
    const user = await firstEntry.locator('[data-testid="timeline-user"]').textContent();

    return {
      action: action?.trim() ?? '',
      timestamp: timestamp?.trim() ?? '',
      user: user?.trim() ?? '',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Assertions
  // ═══════════════════════════════════════════════════════════════════════

  async expectSummaryVisible(): Promise<void> {
    await expect(this.summaryContainer).toBeVisible();
    await expect(this.validCountBadge).toBeVisible();
    await expect(this.compliancePercent).toBeVisible();
  }

  async expectItemStatusIs(
    itemType: ComplianceItemType,
    expectedStatus: ComplianceStatus
  ): Promise<void> {
    const item = await this.getItemByType(itemType);
    expect(item).not.toBeNull();
    expect(item?.status).toBe(expectedStatus);
  }

  async expectExpiryWarning(itemType: ComplianceItemType, daysThreshold: number): Promise<void> {
    const item = await this.getItemByType(itemType);
    expect(item).not.toBeNull();
    expect(item?.daysUntilExpiry).not.toBeNull();
    expect(item!.daysUntilExpiry!).toBeLessThanOrEqual(daysThreshold);
    expect(item?.status).toMatch(/EXPIRING|EXPIRED/);
  }

  async expectRenewalFormValid(): Promise<void> {
    await expect(this.renewModal).toBeVisible();
    await expect(this.fileUploadInput).toBeVisible();
    await expect(this.newExpiryDateInput).toBeVisible();
    await expect(this.submitRenewalButton).toBeDisabled(); // Requires file + date
  }

  async expectAlertPresentFor(itemType: ComplianceItemType): Promise<void> {
    await expect(this.alertBanner).toBeVisible();
    const alertTypes = await this.getAlertTypes();
    const hasRelevantAlert = alertTypes.some((type) => type.includes(itemType));
    expect(hasRelevantAlert).toBe(true);
  }
}
