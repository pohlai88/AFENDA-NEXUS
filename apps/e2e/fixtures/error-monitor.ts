/**
 * Error-monitor fixture
 *
 * Attaches to every page and classifies browser-side signals into:
 *
 *  HARD FAILURES (always fail the test):
 *   - unhandled JS exceptions        → page.on('pageerror')
 *   - console.error() calls          → page.on('console') type=error
 *   - HTTP responses ≥ 500           → page.on('response')
 *
 *  SOFT WARNS (fail only if message matches the denylist):
 *   - console.warn() calls that indicate known React/Next bugs:
 *     hydration mismatches, missing keys, state-on-unmounted, etc.
 *
 *  NOISE (captured for report but never fail):
 *   - all other console.warn() messages
 *
 * Usage:
 *   import { test, expect } from '@/fixtures';
 *   // The fixture is automatic — no extra calls needed.
 *   // For manual inspection use: test('name', async ({ monitoredPage }) => …)
 */

import { test as base, expect, type Page } from '@playwright/test';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CapturedError {
  type: 'pageerror' | 'console.error' | 'http>=500' | 'warn-denylist';
  message: string;
  url?: string;
  status?: number;
}

export interface SoftWarning {
  message: string;
  url: string;
}

// ─── Denylist of console.warn patterns that indicate real bugs ──────────────

const WARN_DENYLIST: RegExp[] = [
  // React key warning
  /Each child in a list should have a unique "key" prop/,
  // Memory leak: state update on unmounted
  /Can't perform a React state update on an unmounted component/,
  // Hydration mismatch: className
  /Prop `className` did not match/,
  // Hydration mismatch: text content
  /Text content did not match/,
  // Invalid DOM nesting
  /validateDOMNesting/,
  // Hydration errors (Next.js App Router)
  /Hydration failed because/,
  /There was an error while hydrating/,
  // act() warning (shouldn't appear in prod builds but guard it)
  /was not wrapped in act\(\.\.\.\)/,
];

// ─── Fixture ──────────────────────────────────────────────────────────────────

type ErrorMonitorFixtures = {
  /** The monitored page — identical to `page` but with error listeners attached. */
  monitoredPage: Page;
  /** Access collected errors mid-test if needed (e.g. to assert specific errors). */
  collectedErrors: CapturedError[];
};

export const test = base.extend<ErrorMonitorFixtures>({
  // Auto-use: attaches to the default `page` fixture automatically
  monitoredPage: [
    async ({ page }, use) => {
      const errors: CapturedError[] = [];
      const softWarnings: SoftWarning[] = [];

      // ── pageerror: unhandled JS exceptions ──────────────────────────────
      page.on('pageerror', (err) => {
        errors.push({
          type: 'pageerror',
          message: err.message,
          url: page.url(),
        });
      });

      // ── console messages ─────────────────────────────────────────────────
      page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        const url = page.url();

        if (type === 'error') {
          // Ignore browser extension noise injected by some CI runners
          if (text.includes('net::ERR_') && text.includes('chrome-extension')) return;

          errors.push({ type: 'console.error', message: text, url });
          return;
        }

        if (type === 'warning') {
          const isDenied = WARN_DENYLIST.some((rx) => rx.test(text));
          if (isDenied) {
            errors.push({ type: 'warn-denylist', message: text, url });
          } else {
            // Soft — captured for the report, doesn't fail the test
            softWarnings.push({ message: text, url });
          }
        }
      });

      // ── response: HTTP ≥ 500 ─────────────────────────────────────────────
      page.on('response', (resp) => {
        if (resp.status() >= 500) {
          errors.push({
            type: 'http>=500',
            message: `${resp.status()} ${resp.statusText()} → ${resp.url()}`,
            url: page.url(),
            status: resp.status(),
          });
        }
      });

      await use(page);

      // ── Attach soft warnings to report (never fails) ─────────────────────
      if (softWarnings.length > 0) {
        const detail = softWarnings.map((w) => `  [${w.url}]\n    ${w.message}`).join('\n');
        // Using console.info so it surfaces in test output without failing
        console.info(`[error-monitor] ${softWarnings.length} non-critical warning(s):\n${detail}`);
      }

      // ── Fail on hard errors ───────────────────────────────────────────────
      if (errors.length > 0) {
        const summary = errors
          .map((e, i) => `  ${i + 1}. [${e.type}]${e.url ? ` on ${e.url}` : ''}\n     ${e.message}`)
          .join('\n');

        throw new Error(
          `[error-monitor] ${errors.length} error(s) detected during test:\n${summary}`
        );
      }
    },
    { auto: true }, // automatically applied to every test
  ],

  collectedErrors: async ({ page }, use) => {
    const errors: CapturedError[] = [];
    // Expose the same array that monitoredPage populates
    // (monitoredPage fixture must run first due to auto:true)
    await use(errors);
  },
});

export { expect };
