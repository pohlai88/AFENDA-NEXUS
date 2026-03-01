import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getPaymentTerms } from '@/features/finance/settings/queries/settings.queries';
import { PaymentTermsTable } from '@/features/finance/settings/blocks/payment-terms-table';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Payment Terms | Finance Settings' };

interface Props {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function PaymentTermsPage({ searchParams }: Props) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const result = await getPaymentTerms(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '50',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load payment terms');
  }

  const terms = result.value.data;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Payment Terms"
        description="Templates referenced during invoice creation."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Settings', href: routes.finance.financeSettings },
          { label: 'Payment Terms' },
        ]}
      />

      {terms.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No payment terms configured yet.</CardContent></Card>
      ) : (
        <PaymentTermsTable terms={terms} />
      )}
    </div>
  </Suspense>
  );
}
