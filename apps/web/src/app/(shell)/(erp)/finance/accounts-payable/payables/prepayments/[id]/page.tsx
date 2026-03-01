import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getPrepayment } from '@/features/finance/payables/queries/prepayment.queries';
import { PrepaymentApplicationsTable } from '@/features/finance/payables/blocks/prepayment-applications-table';
import { ApplyPrepaymentForm } from '@/features/finance/payables/forms/apply-prepayment-form';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getPrepayment(ctx, id);
  if (!result.ok) return { title: 'Prepayment | Finance' };
  return { title: `${result.value.invoiceNumber} | Prepayments` };
}

export default async function PrepaymentDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getPrepayment(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load prepayment');
  }

  const prep = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title={`Prepayment ${prep.invoiceNumber}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Payables', href: routes.finance.payables },
          { label: 'Prepayments', href: routes.finance.prepayments },
          { label: prep.invoiceNumber },
        ]}
      />

      <BusinessDocument
        header={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><span className="text-xs text-muted-foreground">Supplier</span><p className="font-medium">{prep.supplierName}</p></div>
            <div><span className="text-xs text-muted-foreground">Total</span><p className="font-mono font-medium">{prep.currencyCode} {prep.totalAmount}</p></div>
            <div><span className="text-xs text-muted-foreground">Remaining</span><p className="font-mono font-medium">{prep.remainingAmount}</p></div>
            <div><span className="text-xs text-muted-foreground">Status</span><p><Badge variant="default">{prep.status}</Badge></p></div>
          </div>
        }
        tabs={[
          {
            value: 'applications',
            label: `Applications (${prep.applications.length})`,
            content: <PrepaymentApplicationsTable applications={prep.applications} />,
          },
          {
            value: 'apply',
            label: 'Apply',
            content: <ApplyPrepaymentForm prepaymentId={prep.id} />,
          },
        ]}
      />
    </div>
  </Suspense>
  );
}
