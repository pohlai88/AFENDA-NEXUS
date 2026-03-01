/**
 * ShortcutsPage POM
 *
 * Page Object for keyboard shortcut E2E tests.
 * Handles cross-platform modifier keys (Ctrl on Win/Linux, Cmd on Mac).
 *
 * Based on:
 *  - apps/web/src/components/afenda/afenda-shortcut-dialog.tsx
 *  - apps/web/src/components/afenda/afenda-command-palette.tsx
 *  - apps/web/src/lib/sidebar/sidebar-config.ts
 */

import type { Page } from '@playwright/test';

/** Modifier for mod+k, mod+b, etc. Meta on Mac, Control on Win/Linux. */
const MOD_KEY = process.platform === 'darwin' ? 'Meta' : 'Control';

/** Delay between sequence keys (engine buffer is 500ms). */
const SEQUENCE_DELAY_MS = 100;

export class ShortcutsPage {
  constructor(readonly page: Page) {}

  /** Press ? to open the keyboard shortcuts dialog. (? = Shift+/ on US keyboard) */
  async pressHelpShortcut(): Promise<void> {
    await this.page.keyboard.press('Shift+/');
  }

  /** Press mod+K to open the command palette. */
  async pressCommandPaletteShortcut(): Promise<void> {
    await this.page.keyboard.press(`${MOD_KEY}+k`);
  }

  /** Press g then j (Go to Journals). */
  async pressGoToJournalsShortcut(): Promise<void> {
    await this.page.keyboard.press('g');
    await this.page.waitForTimeout(SEQUENCE_DELAY_MS);
    await this.page.keyboard.press('j');
  }

  /** Press g then d (Go to Dashboard). */
  async pressGoToDashboardShortcut(): Promise<void> {
    await this.page.keyboard.press('g');
    await this.page.waitForTimeout(SEQUENCE_DELAY_MS);
    await this.page.keyboard.press('d');
  }

  /** Press c then j (Create Journal). */
  async pressCreateJournalShortcut(): Promise<void> {
    await this.page.keyboard.press('c');
    await this.page.waitForTimeout(SEQUENCE_DELAY_MS);
    await this.page.keyboard.press('j');
  }

  // ─── Locators ─────────────────────────────────────────────────────────────

  get shortcutDialog(): ReturnType<Page['getByRole']> {
    return this.page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
  }

  get commandPaletteDialog(): ReturnType<Page['getByRole']> {
    return this.page.getByRole('dialog', { name: 'Command Palette' });
  }

  get commandPaletteInput(): ReturnType<Page['getByPlaceholder']> {
    return this.page.getByPlaceholder('Search entities, actions, or navigate...');
  }
}
