'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/erp/error-boundary';
import { reportError } from '@/lib/error-reporting';

/**
 * Root Error Boundary
 *
 * Catches unhandled errors in the application and provides a fallback UI.
 * Automatically reports errors to Sentry for monitoring.
 *
 * Note: This is a Client Component because error boundaries must use hooks.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to monitoring (Sentry)
    // digest is automatically captured by Sentry from the error object
    reportError(error, {
      component: 'RootErrorBoundary',
    });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <ErrorDisplay error={error} reset={reset} showHomeLink showBackLink />
    </main>
  );
}
