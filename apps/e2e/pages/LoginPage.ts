/**
 * LoginPage POM
 *
 * Based on apps/web/src/app/(auth)/login/_components/login-form.tsx
 *
 * Real selectors (no data-testid in source — using id/name/role/text):
 *  - h1: "Welcome back"
 *  - email: id="email", placeholder="name@company.com"
 *  - password: id="password"
 *  - submit: type="submit", text "Sign in" / pending "Signing in..."
 *  - error banner: role="alert" (div.text-destructive)
 *  - forgot password: link text "Forgot password?"
 *  - register link: link text "Create account"
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Navigation ---

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await expect(this.heading).toBeVisible();
  }

  // --- Locators ---

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Welcome back' });
  }

  get emailInput(): Locator {
    return this.page.locator('#email');
  }

  get passwordInput(): Locator {
    return this.page.locator('#password');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /^Sign in$/ });
  }

  /** Error banner rendered as role="alert" with text-destructive styling */
  get errorBanner(): Locator {
    return this.page.getByRole('alert');
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: 'Forgot password?' });
  }

  get createAccountLink(): Locator {
    return this.page.getByRole('link', { name: 'Create account' });
  }

  // --- Actions ---

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  }

  // --- Assertions ---

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.heading).toBeVisible();
  }

  async assertError(message: string | RegExp): Promise<void> {
    await expect(this.errorBanner).toBeVisible({ timeout: 8_000 });
    await expect(this.errorBanner).toContainText(message);
  }

  async assertNoError(): Promise<void> {
    await expect(this.errorBanner).toHaveCount(0);
  }

  async assertSubmitPending(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Signing in...' })).toBeVisible();
  }
}
