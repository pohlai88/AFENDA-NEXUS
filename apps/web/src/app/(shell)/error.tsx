'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/erp/error-boundary';
import { reportError } from '@/lib/error-reporting';

/**
 * Shell-level error boundary.
 *
 * Catches uncaught errors that escape per-module boundaries
 * (e.g. layout-level failures, tenant-provider errors) and
 * renders a recovery UI instead of a blank screen.
 */
export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { component: 'ShellErrorBoundary' });
  }, [error]);

  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4">
      <ErrorDisplay error={error} reset={reset} showHomeLink />
    </main>
  );
}
