import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getTaxReturnPeriods } from '@/features/finance/tax/queries/tax.queries';
import { TaxReturnsTable } from '@/features/finance/tax/blocks/tax-returns-table';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Tax Returns | Finance' };

async function TaxReturnsSection({ year }: { year?: number }) {
  const ctx = await getRequestContext();
  const result = await getTaxReturnPeriods(ctx, { year });
  if (!result.ok) throw new Error(result.error);
  return <TaxReturnsTable periods={result.data} />;
}

export default async function TaxReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Returns"
        description="Track tax return periods, filings, and payments."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Tax', href: routes.finance.tax },
          { label: 'Returns' },
        ]}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TaxReturnsSection year={year ? Number(year) : undefined} />
      </Suspense>
    </div>
  );
}
