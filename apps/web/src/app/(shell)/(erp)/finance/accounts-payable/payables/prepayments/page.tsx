import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getPrepayments } from '@/features/finance/payables/queries/prepayment.queries';
import { PrepaymentListTable } from '@/features/finance/payables/blocks/prepayment-list-table';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Prepayments | Finance' };

interface Props {
  searchParams: Promise<{ page?: string; limit?: string; status?: string }>;
}

export default async function PrepaymentListPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const result = await getPrepayments(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '20',
    status: params.status,
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load prepayments');
  }

  const prepayments = result.value.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Prepayments"
        description="AP prepayments and their applications to invoices."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Payables', href: routes.finance.payables },
          { label: 'Prepayments' },
        ]}
      />

      {prepayments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No prepayments found. Prepayments are created as AP invoices with type PREPAYMENT.</CardContent></Card>
      ) : (
        <PrepaymentListTable prepayments={prepayments} />
      )}
    </div>
  </Suspense>
  );
}
