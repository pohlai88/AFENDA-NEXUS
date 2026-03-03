import { Suspense } from 'react';
import Link from 'next/link';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getDunningRuns } from '@/features/finance/receivables/queries/dunning.queries';
import { DunningRunsTable } from '@/features/finance/receivables/blocks/dunning-runs-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Dunning | Finance' };

interface Props {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

async function DunningContent({
  ctx,
  params,
}: {
  ctx: RequestContext;
  params: { page?: string; limit?: string };
}) {
  const result = await getDunningRuns(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '20',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load dunning runs');
  }

  const runs = result.value.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dunning"
        description="Automated dunning runs for overdue receivables."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: 'Dunning' },
        ]}
        actions={
          <Button asChild>
            <Link href={routes.finance.dunningNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Run Dunning
            </Link>
          </Button>
        }
      />

      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No dunning runs yet. Click &ldquo;Run Dunning&rdquo; to start.
          </CardContent>
        </Card>
      ) : (
        <DunningRunsTable runs={runs} />
      )}
    </div>
  );
}

export default async function DunningPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DunningContent ctx={ctx} params={params} />
    </Suspense>
  );
}
