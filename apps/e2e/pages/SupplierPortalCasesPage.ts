/**
 * SupplierPortalCasesPage POM
 *
 * Page Object Model for Supplier Portal Case Management
 * 
 * Routes:
 *  - List:  /portal/cases
 *  - New:   /portal/cases/new
 *  - Detail: /portal/cases/[id]
 *
 * Based on:
 *  - apps/web/src/app/(supplier-portal)/portal/cases/page.tsx
 *  - apps/web/src/app/(supplier-portal)/portal/cases/new/page.tsx
 *  - apps/web/src/app/(supplier-portal)/portal/cases/[id]/page.tsx
 *  - apps/web/src/features/portal/forms/portal-case-form.tsx
 *
 * Case statuses: SUBMITTED | IN_PROGRESS | AWAITING_INFO | ESCALATED | 
 *                RESOLVED | CLOSED | REOPENED | CANCELLED
 * 
 * Categories: PAYMENT_INQUIRY | INVOICE_DISPUTE | ACCOUNT_ISSUE | 
 *             DOCUMENT_REQUEST | GENERAL_INQUIRY | TECHNICAL_ISSUE
 * 
 * Priorities: LOW | MEDIUM | HIGH | CRITICAL
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class SupplierPortalCasesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  async gotoList(): Promise<void> {
    await this.page.goto('/portal/cases');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/portal/cases/new');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoDetail(caseId: string): Promise<void> {
    await this.page.goto(`/portal/cases/${caseId}`);
    await this.page.waitForLoadState('networkidle');
  }

  // ─── List Page Locators ───────────────────────────────────────────────────

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Cases', level: 1 });
  }

  get newCaseButton(): Locator {
    return this.page.getByRole('link', { name: 'New Case' });
  }

  get emptyStateMessage(): Locator {
    return this.page.getByText(/No cases found/i);
  }

  caseCard(ticketNumber: string): Locator {
    return this.page.locator(`[href*="/portal/cases/"]`).filter({ hasText: ticketNumber }).first();
  }

  statusFilter(status: string): Locator {
    return this.page.getByRole('link', { name: status, exact: false });
  }

  categoryFilter(category: string): Locator {
    return this.page.getByRole('link', { name: category, exact: false });
  }

  get searchInput(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="Search"]').first();
  }

  // ─── New Case Form Locators ───────────────────────────────────────────────

  get newCaseHeading(): Locator {
    return this.page.getByRole('heading', { name: 'New Case', level: 1 });
  }

  get subjectInput(): Locator {
    return this.page.locator('#subject, input[name="subject"]');
  }

  get descriptionInput(): Locator {
    return this.page.locator('#description, textarea[name="description"]');
  }

  get categorySelect(): Locator {
    return this.page.locator('#category, select[name="category"]');
  }

  get prioritySelect(): Locator {
    return this.page.locator('#priority, select[name="priority"]');
  }

  get submitCaseButton(): Locator {
    return this.page.getByRole('button', { name: /submit|create case/i });
  }

  get cancelLink(): Locator {
    return this.page.getByRole('link', { name: 'Cancel' });
  }

  // ─── Case Detail Page Locators ────────────────────────────────────────────

  get caseTicketNumber(): Locator {
    return this.page.locator('[class*="font-mono"]').first();
  }

  get caseSubject(): Locator {
    return this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: 'Portal' });
  }

  get caseStatus(): Locator {
    return this.page.locator('[data-status], .status-badge').first();
  }

  get caseDescription(): Locator {
    return this.page.locator('text=/Description|Details/i').locator('..').locator('p, div').first();
  }

  get commentTextarea(): Locator {
    return this.page.locator('#comment, textarea[name="comment"], textarea[placeholder*="Add a comment"]');
  }

  get submitCommentButton(): Locator {
    return this.page.getByRole('button', { name: /add comment|submit|post/i });
  }

  get timelineEntries(): Locator {
    return this.page.locator('[data-timeline-entry], .timeline-item');
  }

  timelineEntry(content: string): Locator {
    return this.page.locator('[data-timeline-entry], .timeline-item').filter({ hasText: content });
  }

  statusTransitionButton(targetStatus: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(targetStatus, 'i') });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async clickNewCase(): Promise<void> {
    await this.newCaseButton.click();
    await expect(this.page).toHaveURL(/\/portal\/cases\/new/);
  }

  async fillNewCaseForm(data: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }): Promise<void> {
    await this.subjectInput.fill(data.subject);
    await this.descriptionInput.fill(data.description);
    
    if (data.category) {
      await this.categorySelect.selectOption({ label: data.category });
    }
    
    if (data.priority) {
      await this.prioritySelect.selectOption({ label: data.priority });
    }
  }

  async submitNewCase(): Promise<void> {
    await this.submitCaseButton.click();
    // Wait for navigation to case detail or list page
    await this.page.waitForURL(/\/portal\/cases\/(?!new)/);
  }

  async createCase(data: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }): Promise<string> {
    await this.gotoNew();
    await this.fillNewCaseForm(data);
    await this.submitNewCase();
    
    // Extract case ID from URL
    const url = this.page.url();
    const match = url.match(/\/portal\/cases\/([^/?]+)/);
    return match ? match[1] : '';
  }

  async addComment(comment: string): Promise<void> {
    await this.commentTextarea.fill(comment);
    await this.submitCommentButton.click();
    
    // Wait for comment to appear in timeline
    await this.page.waitForTimeout(1000);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter(status).click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter(category).click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchCases(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async transitionStatus(targetStatus: string): Promise<void> {
    await this.statusTransitionButton(targetStatus).click();
    
    // Confirm in dialog if present
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|continue/i });
    const isVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      await confirmButton.click();
    }
    
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async expectCaseInList(ticketNumber: string): Promise<void> {
    await expect(this.caseCard(ticketNumber)).toBeVisible();
  }

  async expectStatus(status: string): Promise<void> {
    await expect(this.caseStatus).toContainText(status, { ignoreCase: true });
  }

  async expectTimelineEntryExists(content: string): Promise<void> {
    await expect(this.timelineEntry(content)).toBeVisible();
  }

  async expectCommentInTimeline(comment: string): Promise<void> {
    await this.expectTimelineEntryExists(comment);
  }
}
