'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';

export default function TriageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Triage page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[var(--page-min-h)] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold">Failed to load triage queue</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button asChild>
          <Link href={routes.finance.payables}>Back to Payables</Link>
        </Button>
      </div>
    </div>
  );
}
