import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { ArAllocatePaymentForm } from '@/features/finance/receivables/forms/ar-allocate-payment-form';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getArInvoice } from '@/features/finance/receivables/queries/ar.queries';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Allocate Payment' };

async function ReceivableAllocateContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getArInvoice(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load receivable invoice');
  }

  const invoice = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocate Payment"
        description={`Allocate a payment against invoice ${invoice.invoiceNumber}.`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: invoice.invoiceNumber, href: routes.finance.receivableDetail(id) },
          { label: 'Allocate' },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <ArAllocatePaymentForm invoice={invoice} />
      </div>
    </div>
  );
}

export default async function ReceivableAllocatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ReceivableAllocateContent ctx={ctx} id={id} />
    </Suspense>
  );
}
