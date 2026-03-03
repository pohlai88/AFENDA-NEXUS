import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { ApPaymentForm } from '@/features/finance/payables/forms/ap-payment-form';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getApInvoice } from '@/features/finance/payables/queries/ap.queries';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Record Payment' };

async function PayablePayContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getApInvoice(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load payable invoice');
  }

  const invoice = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description={`Record a payment against invoice ${invoice.invoiceNumber}.`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Payables', href: routes.finance.payables },
          { label: invoice.invoiceNumber, href: routes.finance.payableDetail(id) },
          { label: 'Pay' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <ApPaymentForm invoice={invoice} />
      </div>
    </div>
  );
}

export default async function PayablePayPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PayablePayContent ctx={ctx} id={id} />
    </Suspense>
  );
}
