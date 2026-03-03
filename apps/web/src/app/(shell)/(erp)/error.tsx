'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/erp/error-boundary';
import { reportError } from '@/lib/error-reporting';

export default function ErpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { component: 'ErpErrorBoundary' });
  }, [error]);

  return (
    <main className="flex page-min-h flex-col items-center justify-center px-4">
      <ErrorDisplay error={error} reset={reset} showHomeLink />
    </main>
  );
}
