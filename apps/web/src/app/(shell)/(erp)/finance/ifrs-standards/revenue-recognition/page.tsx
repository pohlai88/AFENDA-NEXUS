import { Suspense } from 'react';
import Link from 'next/link';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getRevenueContracts } from '@/features/finance/revenue-recognition/queries/revenue.queries';
import { RevenueContractsTable } from '@/features/finance/revenue-recognition/blocks/contracts-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Revenue Recognition | Finance' };

interface Props {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

async function RevenueRecognitionContent({
  ctx,
  page,
  limit,
}: {
  ctx: RequestContext;
  page: string;
  limit: string;
}) {
  const result = await getRevenueContracts(ctx, { page, limit });

  if (!result.ok) {
    handleApiError(result, 'Failed to load revenue contracts');
  }

  const contracts = result.value.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Recognition"
        description="IFRS 15 revenue contracts and recognition schedules."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Revenue Recognition' }]}
        actions={
          <Button asChild>
            <Link href={routes.finance.revenueContractNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Contract
            </Link>
          </Button>
        }
      />

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No revenue contracts. Click &ldquo;New Contract&rdquo; to get started.
          </CardContent>
        </Card>
      ) : (
        <RevenueContractsTable contracts={contracts} />
      )}
    </div>
  );
}

export default async function RevenueRecognitionPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const page = params.page ?? '1';
  const limit = params.limit ?? '20';

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RevenueRecognitionContent ctx={ctx} page={page} limit={limit} />
    </Suspense>
  );
}
