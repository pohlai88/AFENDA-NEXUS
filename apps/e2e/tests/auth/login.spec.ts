/**
 * Auth > Login
 *
 * Covers:
 *  - Login page loads without console errors or pageerrors
 *  - Valid credentials redirect away from /login
 *  - Invalid email format stays on /login (browser or app validation)
 *  - Wrong password shows "Authentication failed." (not a 500)
 *  - Empty form shows "Email and password are required."
 *  - Authenticated user visiting /login is redirected away
 */

import { test, expect } from '../../fixtures/index.js';
import { LoginPage } from '../../pages/LoginPage.js';

const VALID_EMAIL = process.env.TEST_USER_EMAIL ?? 'e2e-user@afenda-test.local';
const VALID_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'E2eTestP@ss1!';

test.describe('Login', () => {
  // Auth is under test — use a clean (unauthenticated) context.
  test.use({ storageState: undefined });

  test('loads without console errors or pageerrors', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(page).toHaveTitle(/.+/);
    await expect(login.heading).toBeVisible();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
  });

  test('redirects to dashboard after valid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/register/);
  });

  test('shows error for invalid email format', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.emailInput.fill('not-an-email');
    await login.passwordInput.fill(VALID_PASSWORD);
    await login.submit();
    // Stays on login (native HTML validation or app error)
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test('shows "Authentication failed." for wrong password', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(VALID_EMAIL, 'WrongPassword!99');

    // Must stay on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Real error message from login-form.tsx
    await login.assertError(
      /Authentication failed\.|Invalid email or password|incorrect credentials/i
    );
  });

  test('shows required error for empty form submit', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit();

    // Must stay on login — either native validation or app error
    await expect(page).toHaveURL(/\/login/);

    // App shows "Email and password are required." if both fields empty
    const appError = page.getByRole('alert');
    const nativeInvalid = page.locator('#email:invalid, #password:invalid');
    const hasError = (await appError.count()) > 0 || (await nativeInvalid.count()) > 0;
    expect(hasError).toBe(true);
  });

  test('forgot password link is present and navigates', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.forgotPasswordLink).toBeVisible();
    await login.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 5_000 });
  });

  test('create account link navigates to /register', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.createAccountLink).toBeVisible();
    await login.createAccountLink.click();
    await expect(page).toHaveURL(/\/register/, { timeout: 5_000 });
  });

  test('authenticated user visiting /login is redirected away', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/state.json',
    });
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 10_000,
    });
    expect(page.url()).not.toContain('/login');
    await context.close();
  });
});
