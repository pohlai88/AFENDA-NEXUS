/**
 * Page Object Model for Supplier Portal Escalations
 *
 * Escalation lifecycle:
 *   ESCALATION_REQUESTED → ESCALATION_ASSIGNED → ESCALATION_IN_PROGRESS → ESCALATION_RESOLVED
 *
 * SLA timers:
 *   - Respond by: 48 hours
 *   - Resolve by: 5 days
 */
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export type EscalationStatus =
  | 'ESCALATION_REQUESTED'
  | 'ESCALATION_ASSIGNED'
  | 'ESCALATION_IN_PROGRESS'
  | 'ESCALATION_RESOLVED';

export class SupplierPortalEscalationsPage {
  readonly page: Page;

  // Navigation
  readonly escalationsLink: Locator;

  // List page
  readonly pageTitle: Locator;
  readonly emptyState: Locator;
  readonly escalationTable: Locator;
  readonly escalationRows: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly caseIdFilter: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;

  // Pagination
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageInfo: Locator;

  // Trigger escalation (from case detail)
  readonly triggerEscalationButton: Locator;
  readonly escalationReasonTextarea: Locator;
  readonly submitEscalationButton: Locator;
  readonly cancelEscalationButton: Locator;

  // Detail page
  readonly escalationId: Locator;
  readonly escalationStatus: Locator;
  readonly escalationReason: Locator;
  readonly caseLink: Locator;
  readonly respondByTimer: Locator;
  readonly resolveByTimer: Locator;
  readonly slaWarning: Locator;
  readonly slaBreach: Locator;

  // Resolution (buyer-side)
  readonly resolveButton: Locator;
  readonly resolutionNotesTextarea: Locator;
  readonly submitResolutionButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.escalationsLink = page.getByRole('link', { name: /escalations/i });

    // List page
    this.pageTitle = page.getByRole('heading', { name: /escalations/i, level: 1 });
    this.emptyState = page.getByText(/no escalations found/i);
    this.escalationTable = page.getByRole('table');
    this.escalationRows = page.locator('tbody tr');

    // Filters
    this.statusFilter = page.getByLabel(/status/i);
    this.caseIdFilter = page.getByLabel(/case/i);
    this.applyFiltersButton = page.getByRole('button', { name: /apply filters/i });
    this.clearFiltersButton = page.getByRole('button', { name: /clear filters/i });

    // Pagination
    this.previousPageButton = page.getByRole('button', { name: /previous/i });
    this.nextPageButton = page.getByRole('button', { name: /next/i });
    this.pageInfo = page.locator('[data-testid="page-info"]');

    // Trigger escalation
    this.triggerEscalationButton = page.getByRole('button', { name: /escalate/i });
    this.escalationReasonTextarea = page.getByLabel(/reason/i);
    this.submitEscalationButton = page.getByRole('button', { name: /submit escalation/i });
    this.cancelEscalationButton = page.getByRole('button', { name: /cancel/i });

    // Detail page
    this.escalationId = page.locator('[data-testid="escalation-id"]');
    this.escalationStatus = page.locator('[data-testid="escalation-status"]');
    this.escalationReason = page.locator('[data-testid="escalation-reason"]');
    this.caseLink = page.getByRole('link', { name: /case #/i });
    this.respondByTimer = page.locator('[data-testid="respond-by-timer"]');
    this.resolveByTimer = page.locator('[data-testid="resolve-by-timer"]');
    this.slaWarning = page.locator('[data-testid="sla-warning"]');
    this.slaBreach = page.locator('[data-testid="sla-breach"]');

    // Resolution
    this.resolveButton = page.getByRole('button', { name: /resolve escalation/i });
    this.resolutionNotesTextarea = page.getByLabel(/resolution notes/i);
    this.submitResolutionButton = page.getByRole('button', { name: /submit resolution/i });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async gotoList() {
    await this.page.goto('/portal/escalations');
    await this.pageTitle.waitFor();
  }

  async gotoDetail(escalationId: string) {
    await this.page.goto(`/portal/escalations/${escalationId}`);
    await this.escalationId.waitFor();
  }

  // ─── Trigger Escalation ────────────────────────────────────────────────────

  /**
   * Trigger escalation from case detail page.
   * Assumes we're already on a case detail page with an open case.
   */
  async triggerEscalationFromCase(reason: string): Promise<void> {
    await this.triggerEscalationButton.click();
    await this.escalationReasonTextarea.waitFor();
    await this.escalationReasonTextarea.fill(reason);
    await this.submitEscalationButton.click();
  }

  /**
   * Fill trigger escalation form without submitting.
   */
  async fillTriggerEscalationForm(reason: string): Promise<void> {
    await this.triggerEscalationButton.click();
    await this.escalationReasonTextarea.waitFor();
    await this.escalationReasonTextarea.fill(reason);
  }

  // ─── List Operations ───────────────────────────────────────────────────────

  async filterByStatus(status: EscalationStatus): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCaseId(caseId: string): Promise<void> {
    await this.caseIdFilter.fill(caseId);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPreviousPage(): Promise<void> {
    await this.previousPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Detail View ───────────────────────────────────────────────────────────

  async getEscalationId(): Promise<string> {
    return (await this.escalationId.textContent()) ?? '';
  }

  async getEscalationStatus(): Promise<string> {
    return (await this.escalationStatus.textContent()) ?? '';
  }

  async getEscalationReason(): Promise<string> {
    return (await this.escalationReason.textContent()) ?? '';
  }

  async getRespondByHours(): Promise<number> {
    const text = await this.respondByTimer.textContent();
    const match = text?.match(/(\d+)\s*hours?/i);
    return match ? parseInt(match[1] ?? '0', 10) : 0;
  }

  async getResolveByHours(): Promise<number> {
    const text = await this.resolveByTimer.textContent();
    const match = text?.match(/(\d+)\s*hours?/i);
    return match ? parseInt(match[1] ?? '0', 10) : 0;
  }

  async isSlaWarningVisible(): Promise<boolean> {
    return this.slaWarning.isVisible();
  }

  async isSlaBreached(): Promise<boolean> {
    return this.slaBreach.isVisible();
  }

  // ─── Resolve Escalation (Buyer-side) ───────────────────────────────────────

  async resolveEscalation(resolutionNotes: string): Promise<void> {
    await this.resolveButton.click();
    await this.resolutionNotesTextarea.waitFor();
    await this.resolutionNotesTextarea.fill(resolutionNotes);
    await this.submitResolutionButton.click();
  }

  async fillResolveForm(resolutionNotes: string): Promise<void> {
    await this.resolveButton.click();
    await this.resolutionNotesTextarea.waitFor();
    await this.resolutionNotesTextarea.fill(resolutionNotes);
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async expectEscalationInList(escalationId: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${escalationId}")`);
    await expect(row).toBeVisible();
  }

  async expectEscalationNotInList(escalationId: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${escalationId}")`);
    await expect(row).not.toBeVisible();
  }

  async expectStatus(expectedStatus: EscalationStatus | RegExp): Promise<void> {
    if (expectedStatus instanceof RegExp) {
      await expect(this.escalationStatus).toContainText(expectedStatus);
    } else {
      await expect(this.escalationStatus).toContainText(expectedStatus);
    }
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async expectListNotEmpty(): Promise<void> {
    await expect(this.escalationRows.first()).toBeVisible();
  }

  async expectValidationError(message: string | RegExp): Promise<void> {
    const error = this.page.getByText(message);
    await expect(error).toBeVisible();
  }

  async expectSlaTimersVisible(): Promise<void> {
    await expect(this.respondByTimer).toBeVisible();
    await expect(this.resolveByTimer).toBeVisible();
  }

  async expectCaseLinkVisible(caseId: string): Promise<void> {
    await expect(this.caseLink).toContainText(caseId);
  }

  async expectPageCount(currentPage: number, totalPages: number): Promise<void> {
    const pageText = await this.pageInfo.textContent();
    expect(pageText).toContain(`${currentPage}`);
    expect(pageText).toContain(`${totalPages}`);
  }

  /**
   * Get the number of escalations currently displayed.
   */
  async getEscalationCount(): Promise<number> {
    const count = await this.escalationRows.count();
    // Check if empty state is visible
    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    return isEmpty ? 0 : count;
  }

  /**
   * Click on an escalation row to navigate to detail page.
   */
  async clickEscalation(escalationId: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${escalationId}")`);
    await row.click();
    await this.escalationId.waitFor();
  }

  /**
   * Extract escalation ID from the first row (for dynamic tests).
   */
  async getFirstEscalationId(): Promise<string> {
    const firstRow = this.escalationRows.first();
    const idCell = firstRow.locator('td').first();
    return (await idCell.textContent())?.trim() ?? '';
  }
}
