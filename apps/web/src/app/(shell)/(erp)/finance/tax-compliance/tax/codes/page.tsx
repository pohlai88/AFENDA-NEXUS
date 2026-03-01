import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { getTaxCodes } from '@/features/finance/tax/queries/tax.queries';
import { TaxCodesTable } from '@/features/finance/tax/blocks/tax-codes-table';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Tax Codes | Finance' };

async function TaxCodesSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getTaxCodes(ctx, { status });
  if (!result.ok) throw new Error(result.error);
  return <TaxCodesTable taxCodes={result.data} />;
}

export default async function TaxCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Codes"
        description="Manage tax codes, rates, and jurisdictions."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Tax', href: routes.finance.tax },
          { label: 'Codes' },
        ]}
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TaxCodesSection status={status} />
      </Suspense>
    </div>
  );
}
