import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getFxRates } from '@/features/finance/fx/queries/fx.queries';
import { FxRateCreateForm } from '@/features/finance/fx/blocks/fx-rate-create-form';
import { FxRateList } from '@/features/finance/fx/blocks/fx-rate-list';
import { FxPagination } from '@/features/finance/fx/blocks/fx-pagination';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'FX Rates' };

interface FxRatesPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    date?: string;
    page?: string;
    limit?: string;
  }>;
}

async function FxRatesContent({
  ctx,
  params,
}: {
  ctx: RequestContext;
  params: { from?: string; to?: string; date?: string; page?: string; limit?: string };
}) {
  const result = await getFxRates(ctx, {
    from: params.from,
    to: params.to,
    date: params.date,
    page: params.page ?? '1',
    limit: params.limit ?? '25',
  });

  if (!result.ok) handleApiError(result, 'Failed to load FX rates');

  const { data: rates, total, page, limit } = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="FX Rates"
        description="Manage foreign exchange rates for multi-currency transactions."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'FX Rates' }]}
      />

      <details className="rounded-md border p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4" />
          Add FX Rate
        </summary>
        <div className="mt-4">
          <FxRateCreateForm />
        </div>
      </details>

      {rates.length === 0 ? (
        <EmptyState contentKey="finance.fxRates" constraint="page" icon={ArrowRightLeft} />
      ) : (
        <FxRateList data={rates} />
      )}

      <FxPagination page={page} totalPages={Math.ceil(total / limit)} total={total} />
    </div>
  );
}

export default async function FxRatesPage({ searchParams }: FxRatesPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FxRatesContent ctx={ctx} params={params} />
    </Suspense>
  );
}
