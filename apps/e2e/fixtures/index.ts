/**
 * Fixtures barrel — import `test` and `expect` from here in all specs.
 *
 *   import { test, expect } from '@/fixtures';
 *
 * The `test` re-exported here already includes the error-monitor fixture
 * (auto-use) so every spec automatically catches console.error, pageerror,
 * and HTTP ≥500 without any extra setup.
 */

export { test, expect, type CapturedError, type SoftWarning } from './error-monitor.js';
