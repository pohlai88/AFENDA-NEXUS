import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { getRequestContext } from '@/lib/auth';
import { getMatchTolerances } from '@/features/finance/payables/queries/match-tolerance.queries';
import { MatchToleranceTable } from '@/features/finance/payables/blocks/match-tolerance-table';
import { handleApiError } from '@/lib/api-error.server';
import { routes } from '@/lib/constants';

export const metadata = {
  title: 'Match Tolerances',
  description: 'Configure PO–receipt–invoice matching tolerance rules.',
};

export default async function MatchTolerancesPage() {
  const ctx = await getRequestContext();
  const result = await getMatchTolerances(ctx);
  if (!result.ok) handleApiError(result, 'Failed to load match tolerance rules');
  const rules = result.ok ? result.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Tolerances"
        description="Define tolerance rules for PO–receipt–invoice matching. Invoices outside tolerance can be auto-held."
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.root },
          { label: 'Payables', href: routes.finance.payables },
          { label: 'Match Tolerances' },
        ]}
        actions={
          <Link
            href={routes.finance.payables}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Payables
          </Link>
        }
      />

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <MatchToleranceTable data={rules} />
      </Suspense>
    </div>
  );
}
