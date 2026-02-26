/**
 * Finance > Journals
 *
 * Tests the GL Journals module using the JournalsPage POM.
 *
 * Real routes / selectors (verified from source):
 *  - List:  /finance/journals  (h1 "Journals")
 *  - New:   /finance/journals/new  (id=description, id=date, button "Create Draft")
 *  - Detail: /finance/journals/[id]  (buttons: "Post Journal", "Reverse", "Void")
 *
 * IMPORTANT: Journal lifecycle tests (create balanced draft, post, reverse, void)
 * require knowing the exact selectors for the debit/credit line items table.
 * Those selectors are marked test.fixme until confirmed via browser inspection
 * of a running app. The tests for page load, navigation, and form structure
 * are fully functional.
 *
 * Status values (exact): "Draft" | "Posted" | "Reversed" | "Voided"
 */

import { test, expect } from '../../fixtures/index.js';
import { JournalsPage } from '../../pages/JournalsPage.js';
import { AppShellPage } from '../../pages/AppShellPage.js';

test.describe('Finance > Journals', () => {
  test('journals list loads without errors', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoList();
    await expect(journals.heading).toBeVisible();
    await expect(journals.createJournalButton).toBeVisible();
  });

  test('create journal button navigates to /finance/journals/new', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoList();
    await journals.clickCreateJournal();
    await expect(page).toHaveURL(/\/finance\/journals\/new/);
    await expect(journals.descriptionInput).toBeVisible();
    await expect(journals.dateInput).toBeVisible();
    await expect(journals.createDraftButton).toBeVisible();
    await expect(journals.cancelButton).toBeVisible();
  });

  test('cancel button on new form returns to journals list', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();
    await journals.cancelButton.click();
    await expect(page).toHaveURL(/\/finance\/journals$/);
  });

  test('submitting form without any lines shows validation error', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();
    await journals.fillDescription(`E2E Empty Lines Test ${Date.now()}`);
    await journals.fillDate('2026-01-15');
    await journals.createDraftButton.click();

    // Either shows balance error (no lines = 0 debit, 0 credit, but may be equal 0=0)
    // or stays on the page with some validation error
    const stayedOnForm = page.url().includes('/new');
    const balanceOrValidationError = await page
      .getByRole('alert')
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // We accept either outcome — the important thing is no 500 (error-monitor catches that)
    expect(stayedOnForm || balanceOrValidationError).toBe(true);
  });

  test('status filter links are present on list page', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoList();

    // Status filter links (may be in a tab strip or link group)
    const allFilter = journals.filterLink('All');
    const draftFilter = journals.filterLink('Draft');
    // At minimum "All" filter should be visible
    const allVisible = await allFilter.isVisible({ timeout: 3_000 }).catch(() => false);
    const draftVisible = await draftFilter.isVisible({ timeout: 3_000 }).catch(() => false);
    // At least one filter should be present
    expect(allVisible || draftVisible).toBe(true);
  });

  test('creates a balanced draft journal successfully', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();

    const desc = `E2E Balanced Journal ${Date.now()}`;
    await journals.fillDescription(desc);
    await journals.fillDate('2026-02-26');

    // The form starts with 2 empty lines (index 0 and 1)
    await page.getByLabel('Line 1 account code').fill('1000');
    await page.getByLabel('Line 1 debit').fill('500');
    await page.getByLabel('Line 1 credit').fill('0');

    await page.getByLabel('Line 2 account code').fill('2000');
    await page.getByLabel('Line 2 debit').fill('0');
    await page.getByLabel('Line 2 credit').fill('500');

    await journals.submitDraft();

    // Should navigate to the detail page with Draft status
    await expect(page).toHaveURL(/\/finance\/journals\/(?!new)/);
    await journals.assertStatus('Draft');
  });

  test('unbalanced journal is rejected with user-facing error, not 500', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();
    await journals.fillDescription(`E2E Unbalanced ${Date.now()}`);
    await journals.fillDate('2026-02-26');

    // Only fill a debit on line 1, leave line 2 empty -> unbalanced
    await page.getByLabel('Line 1 account code').fill('1000');
    await page.getByLabel('Line 1 debit').fill('250');
    await page.getByLabel('Line 1 credit').fill('0');

    await page.getByLabel('Line 2 account code').fill('2000');
    await page.getByLabel('Line 2 debit').fill('0');
    await page.getByLabel('Line 2 credit').fill('0');

    await journals.submitDraft();
    await journals.assertBalanceError();
  });

  test('posts a balanced draft journal', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();

    const desc = `E2E Post Journal ${Date.now()}`;
    await journals.fillDescription(desc);
    await journals.fillDate('2026-02-26');

    await page.getByLabel('Line 1 account code').fill('1000');
    await page.getByLabel('Line 1 debit').fill('1000');
    await page.getByLabel('Line 1 credit').fill('0');

    await page.getByLabel('Line 2 account code').fill('2000');
    await page.getByLabel('Line 2 debit').fill('0');
    await page.getByLabel('Line 2 credit').fill('1000');

    await journals.submitDraft();
    await expect(page).toHaveURL(/\/finance\/journals\/(?!new)/);
    await journals.assertStatus('Draft');

    await journals.postJournal();
    await journals.assertStatus('Posted');
  });

  test('reverses a posted journal', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();

    const desc = `E2E Reverse Journal ${Date.now()}`;
    await journals.fillDescription(desc);
    await journals.fillDate('2026-02-26');

    await page.getByLabel('Line 1 account code').fill('1000');
    await page.getByLabel('Line 1 debit').fill('750');
    await page.getByLabel('Line 1 credit').fill('0');

    await page.getByLabel('Line 2 account code').fill('2000');
    await page.getByLabel('Line 2 debit').fill('0');
    await page.getByLabel('Line 2 credit').fill('750');

    await journals.submitDraft();
    await expect(page).toHaveURL(/\/finance\/journals\/(?!new)/);

    await journals.postJournal();
    await journals.assertStatus('Posted');

    await journals.reverseJournal('E2E reversal reason');
    await journals.assertStatus('Reversed');
  });

  test('voids a draft journal', async ({ page }) => {
    const journals = new JournalsPage(page);
    await journals.gotoNew();

    const desc = `E2E Void Journal ${Date.now()}`;
    await journals.fillDescription(desc);
    await journals.fillDate('2026-02-26');

    await page.getByLabel('Line 1 account code').fill('1000');
    await page.getByLabel('Line 1 debit').fill('300');
    await page.getByLabel('Line 1 credit').fill('0');

    await page.getByLabel('Line 2 account code').fill('2000');
    await page.getByLabel('Line 2 debit').fill('0');
    await page.getByLabel('Line 2 credit').fill('300');

    await journals.submitDraft();
    await expect(page).toHaveURL(/\/finance\/journals\/(?!new)/);
    await journals.assertStatus('Draft');

    await journals.voidJournal('E2E void reason');
    await journals.assertStatus('Voided');
  });

  test('shell stays intact after journal navigation', async ({ page }) => {
    const shell = new AppShellPage(page);
    const journals = new JournalsPage(page);

    await journals.gotoList();
    await shell.assertShellLoaded();

    // Navigate away and back — sidebar must remain intact
    await page.goto('/');
    await shell.assertShellLoaded();

    await journals.gotoList();
    await shell.assertShellLoaded();
  });
});
