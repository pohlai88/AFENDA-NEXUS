/**
 * Shortcuts > Keyboard Shortcuts E2E
 *
 * Tests critical keyboard shortcuts following Playwright best practices:
 *  - Web-first assertions (expect, locators)
 *  - Test isolation (fresh page per test)
 *  - Accessible selectors (getByRole, getByPlaceholder)
 *  - Cross-platform modifier keys (Ctrl on Win/Linux, Cmd on Mac)
 *
 * Covers:
 *  - ? opens shortcut dialog
 *  - mod+K opens command palette
 *  - g j navigates to Journals
 *  - g d navigates to Dashboard
 *  - c j navigates to New Journal
 */

import { test, expect } from '../../fixtures/index.js';
import { ShortcutsPage } from '../../pages/ShortcutsPage.js';

test.describe('Keyboard shortcuts', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page }) => {
    // Use /finance/journals — a stable route with full shell (avoids / → /finance redirect timing)
    await page.goto('/finance/journals');
    await page.waitForLoadState('networkidle');
    // Ensure shell is ready: sidebar or main content visible
    await page.locator('[data-slot="sidebar"], #afenda-main-content, main').first().waitFor({ state: 'visible', timeout: 15_000 });
    // Blur any input so shortcuts fire (engine ignores keys when focus is in input/textarea)
    await page.keyboard.press('Escape');
  });

  test('? opens shortcut dialog', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressHelpShortcut();

    await expect(shortcuts.shortcutDialog).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();
    await expect(page.getByPlaceholder('Filter shortcuts...')).toBeVisible();
  });

  test('mod+K opens command palette', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressCommandPaletteShortcut();

    await expect(shortcuts.commandPaletteDialog).toBeVisible({ timeout: 5_000 });
    await expect(shortcuts.commandPaletteInput).toBeVisible();
  });

  test('g j navigates to Journals', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressGoToJournalsShortcut();

    await expect(page).toHaveURL(/\/finance\/journals/, { timeout: 5_000 });
    await expect(page.locator('#afenda-main-content, #main-content').first()).toBeVisible();
  });

  test('g d navigates to Dashboard', async ({ page }) => {
    // Start from a different page
    await page.goto('/finance/journals');
    await page.waitForLoadState('networkidle');

    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressGoToDashboardShortcut();

    await expect(page).not.toHaveURL(/\/journals/);
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('c j navigates to New Journal', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressCreateJournalShortcut();

    await expect(page).toHaveURL(/\/finance\/journals\/new/, { timeout: 5_000 });
    await expect(page.locator('#afenda-main-content, #main-content').first()).toBeVisible();
  });

  test('shortcut dialog can be closed with Escape', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressHelpShortcut();
    await expect(shortcuts.shortcutDialog).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await expect(shortcuts.shortcutDialog).not.toBeVisible({ timeout: 3_000 });
  });

  test('command palette can be closed with Escape', async ({ page }) => {
    const shortcuts = new ShortcutsPage(page);
    await shortcuts.pressCommandPaletteShortcut();
    await expect(shortcuts.commandPaletteDialog).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await expect(shortcuts.commandPaletteDialog).not.toBeVisible({ timeout: 3_000 });
  });
});
