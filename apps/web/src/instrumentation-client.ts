/**
 * Client-side instrumentation — loaded once when the browser bundle initializes.
 * Contains Sentry client init (replaces deprecated sentry.client.config.ts for Turbopack).
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// Instrument client-side navigations for Sentry performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
