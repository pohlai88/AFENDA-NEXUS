'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/erp/error-boundary';
import { reportError } from '@/lib/error-reporting';

export default function DuplicatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { component: 'DuplicatesError' });
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <ErrorDisplay error={error} reset={reset} title="Failed to load duplicate review" showHomeLink showBackLink />
    </main>
  );
}
