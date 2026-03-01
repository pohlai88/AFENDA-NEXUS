import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getMatchTolerances } from '@/features/finance/settings/queries/settings.queries';
import { MatchTolerancesTable } from '@/features/finance/settings/blocks/match-tolerances-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Match Tolerance | Finance Settings' };

interface Props {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function MatchTolerancePage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await getRequestContext();
  const result = await getMatchTolerances(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '50',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load match tolerances');
  }

  const tolerances = result.value.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Match Tolerance"
        description="Configure AP auto-matching thresholds."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Settings', href: routes.finance.financeSettings },
          { label: 'Match Tolerance' },
        ]}
        actions={
          <Button asChild>
            <Link href={routes.finance.matchToleranceNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Tolerance
            </Link>
          </Button>
        }
      />

      {tolerances.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No match tolerances configured. Click &ldquo;Add Tolerance&rdquo; to create one.</CardContent></Card>
      ) : (
        <MatchTolerancesTable tolerances={tolerances} />
      )}
    </div>
  </Suspense>
  );
}
