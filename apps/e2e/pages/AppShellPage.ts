/**
 * AppShellPage POM
 *
 * Based on apps/web/src/components/erp/app-shell.tsx
 *              apps/web/src/components/erp/sidebar-nav.tsx
 *
 * Real selectors:
 *  - main#main-content (id="main-content", tabIndex={-1})
 *  - Skip link: "Skip to main content"
 *  - Toaster: [data-sonner-toast] (Sonner, position="bottom-right")
 *  - Sidebar rendered as aside[data-slot="sidebar"]
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class AppShellPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Locators ---

  get mainContent(): Locator {
    return this.page.locator('#main-content');
  }

  get sidebar(): Locator {
    return this.page
      .locator('[data-slot="sidebar"]')
      .or(this.page.getByRole('complementary'))
      .first();
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: /Search/ });
  }

  get toaster(): Locator {
    return this.page.locator('[data-sonner-toast]');
  }

  // --- Navigation helpers ---

  private navLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name }).first();
  }

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateTo(linkText: string | RegExp): Promise<void> {
    await this.navLink(linkText).click();
    await this.page.waitForLoadState('networkidle');
  }

  // --- Assertions ---

  async assertShellLoaded(): Promise<void> {
    await expect(this.mainContent).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText('Something went wrong')).toHaveCount(0);
  }

  async assertPageHeading(text: string | RegExp): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level: 1 }).filter({ hasText: text })
    ).toBeVisible({ timeout: 10_000 });
  }

  async assertNoBlankMain(): Promise<void> {
    const text = await this.mainContent.innerText();
    expect(text.trim().length).toBeGreaterThan(5);
  }

  async assertToastVisible(text?: string | RegExp): Promise<void> {
    const toast = this.toaster.first();
    await expect(toast).toBeVisible({ timeout: 10_000 });
    if (text) {
      await expect(toast).toContainText(text);
    }
  }

  async assertEmptyState(title: string | RegExp): Promise<void> {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 });
  }
}
