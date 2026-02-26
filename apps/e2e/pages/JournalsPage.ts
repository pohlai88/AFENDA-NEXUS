/**
 * JournalsPage POM
 *
 * Based on:
 *  - apps/web/src/app/(shell)/finance/journals/page.tsx
 *  - apps/web/src/app/(shell)/finance/journals/new/page.tsx
 *  - apps/web/src/features/finance/journals/forms/journal-draft-form.tsx
 *  - apps/web/src/features/finance/journals/blocks/journal-actions.tsx
 *
 * Exact selectors (no data-testid):
 *
 *  List page (/finance/journals):
 *   - h1: "Journals"
 *   - "Create Journal" link -> /finance/journals/new
 *   - Status filters: "All", "Draft", "Posted", "Reversed", "Voided"
 *   - Empty state h3: "No journals found"
 *
 *  New page (/finance/journals/new):
 *   - id="description", id="date"
 *   - submit: "Create Draft" / pending "Creating..."
 *   - cancel: "Cancel" link
 *   - balance error: role="alert" "Debits must equal credits before submitting."
 *
 *  Detail page (/finance/journals/[id]):
 *   - "Post Journal", "Reverse", "Void" buttons
 *   - Reverse dialog: id="reason", "Confirm Reverse"
 *   - Void dialog: "Confirm Void"
 *
 *  Status badges: "Draft" / "Posted" / "Reversed" / "Voided"
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class JournalsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Locators: list page ---

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Journals', level: 1 });
  }

  get createJournalButton(): Locator {
    return this.page.getByRole('link', { name: 'Create Journal' });
  }

  get emptyStateHeading(): Locator {
    return this.page.getByRole('heading', { name: 'No journals found' });
  }

  filterLink(status: 'All' | 'Draft' | 'Posted' | 'Reversed' | 'Voided'): Locator {
    return this.page.getByRole('link', { name: status, exact: true });
  }

  journalRow(description: string): Locator {
    return this.page.getByRole('row').filter({ hasText: description });
  }

  // --- Locators: new/form page ---

  get descriptionInput(): Locator {
    return this.page.locator('#description');
  }

  get dateInput(): Locator {
    return this.page.locator('#date');
  }

  get createDraftButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Draft' });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('link', { name: 'Cancel' });
  }

  get balanceErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({
      hasText: 'Debits must equal credits before submitting.',
    });
  }

  // --- Locators: detail/actions ---

  get postJournalButton(): Locator {
    return this.page.getByRole('button', { name: 'Post Journal' });
  }

  get reverseButton(): Locator {
    return this.page.getByRole('button', { name: 'Reverse' });
  }

  get voidButton(): Locator {
    return this.page.getByRole('button', { name: 'Void' });
  }

  get reversalReasonInput(): Locator {
    return this.page.locator('#reason');
  }

  get confirmReverseButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Reverse' });
  }

  get confirmVoidButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm Void' });
  }

  // --- Navigation ---

  async gotoList(): Promise<void> {
    await this.page.goto('/finance/journals');
    await this.page.waitForLoadState('networkidle');
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/finance/journals/new');
    await this.page.waitForLoadState('networkidle');
    await expect(this.descriptionInput).toBeVisible({ timeout: 10_000 });
  }

  async clickCreateJournal(): Promise<void> {
    await this.createJournalButton.click();
    await this.page.waitForURL('**/finance/journals/new');
    await expect(this.descriptionInput).toBeVisible({ timeout: 10_000 });
  }

  // --- Form actions ---

  async fillDescription(text: string): Promise<void> {
    await this.descriptionInput.fill(text);
  }

  async fillDate(isoDate: string): Promise<void> {
    await this.dateInput.fill(isoDate);
  }

  async submitDraft(): Promise<void> {
    await this.createDraftButton.click();
    await Promise.race([
      this.page.waitForURL('**/finance/journals/**', { timeout: 15_000 }),
      this.balanceErrorAlert.waitFor({ timeout: 5_000 }),
    ]).catch(() => {});
  }

  // --- Detail actions ---

  async postJournal(): Promise<void> {
    await this.postJournalButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async reverseJournal(reason = 'E2E test reversal'): Promise<void> {
    await this.reverseButton.click();
    await expect(this.page.getByRole('dialog', { name: 'Reverse Journal' })).toBeVisible({
      timeout: 5_000,
    });
    await this.reversalReasonInput.fill(reason);
    await this.confirmReverseButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async voidJournal(reason = 'E2E test void'): Promise<void> {
    await this.voidButton.click();
    await expect(this.page.getByRole('dialog', { name: 'Void Journal' })).toBeVisible({
      timeout: 5_000,
    });
    const reasonField = this.page.locator('#reason');
    if (await reasonField.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await reasonField.fill(reason);
    }
    await this.confirmVoidButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // --- Assertions ---

  async assertStatus(status: 'Draft' | 'Posted' | 'Reversed' | 'Voided'): Promise<void> {
    await expect(this.page.getByText(status, { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async assertBalanceError(): Promise<void> {
    await expect(this.balanceErrorAlert).toBeVisible({ timeout: 8_000 });
  }

  async assertNoBalanceError(): Promise<void> {
    await expect(this.balanceErrorAlert).toHaveCount(0);
  }

  async assertEmptyState(): Promise<void> {
    await expect(this.emptyStateHeading).toBeVisible({ timeout: 10_000 });
  }
}
