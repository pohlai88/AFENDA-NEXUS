'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/erp/error-boundary';
import { reportError } from '@/lib/error-reporting';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to monitoring
    reportError(error, { component: 'RootErrorBoundary' });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <ErrorDisplay
        error={error}
        reset={reset}
        showHomeLink
        showBackLink
      />
    </main>
  );
}
