import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getFxRates } from '@/features/finance/fx/queries/fx.queries';
import { FxRateCreateForm } from '@/features/finance/fx/blocks/fx-rate-create-form';
import { FxRateList } from '@/features/finance/fx/blocks/fx-rate-list';
import { ArrowRightLeft, Plus } from 'lucide-react';

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

export default async function FxRatesPage({ searchParams }: FxRatesPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getFxRates(ctx, {
    from: params.from,
    to: params.to,
    date: params.date,
    page: params.page ?? '1',
    limit: params.limit ?? '25',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load FX rates');
  }

  const rates = result.value.data;
  const { total, page, limit } = result.value;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="FX Rates"
        description="Manage foreign exchange rates for multi-currency transactions."
        breadcrumbs={[{ label: 'Finance', href: '/finance/journals' }, { label: 'FX Rates' }]}
      />

      {/* Inline create form */}
      <details className="rounded-md border p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4" />
          Add FX Rate
        </summary>
        <div className="mt-4">
          <FxRateCreateForm />
        </div>
      </details>

      {/* Table */}
      {rates.length === 0 ? (
        <EmptyState
          title="No FX rates"
          description="Add exchange rates for multi-currency reporting and transactions."
          icon={ArrowRightLeft}
        />
      ) : (
        <FxRateList data={rates} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} rates)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/finance/fx-rates?page=${page - 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/finance/fx-rates?page=${page + 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
