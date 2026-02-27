/**
 * Client-side instrumentation — loaded once when the browser bundle initializes.
 * Imports the Sentry browser SDK config for client-side error tracking.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */
import * as Sentry from '@sentry/nextjs';
import '../sentry.client.config';

// Instrument client-side navigations for Sentry performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
