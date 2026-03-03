import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getPaymentTermsById } from '@/features/finance/settings/queries/settings.queries';
import { PaymentTermsLinesTable } from '@/features/finance/settings/blocks/payment-terms-lines-table';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getPaymentTermsById(ctx, id);
  if (!result.ok) return { title: 'Payment Terms | Finance Settings' };
  return { title: `${result.value.code} — ${result.value.name} | Payment Terms` };
}

async function PaymentTermsDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getPaymentTermsById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load payment terms');
  }

  const terms = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${terms.code} — ${terms.name}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Settings', href: routes.finance.financeSettings },
          { label: 'Payment Terms', href: routes.finance.paymentTerms },
          { label: terms.code },
        ]}
      />

      <BusinessDocument
        header={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <span className="text-xs text-muted-foreground">Due Days</span>
              <p className="font-medium">{terms.dueDays}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Discount</span>
              <p className="font-medium">
                {terms.discountPercent != null
                  ? `${terms.discountPercent}% / ${terms.discountDays} days`
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Status</span>
              <p>
                <Badge variant={terms.isActive ? 'default' : 'secondary'}>
                  {terms.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Description</span>
              <p className="font-medium">{terms.description ?? '—'}</p>
            </div>
          </div>
        }
        tabs={[
          {
            value: 'lines',
            label: `Lines (${terms.lines.length})`,
            content: <PaymentTermsLinesTable lines={terms.lines} />,
          },
        ]}
      />
    </div>
  );
}

export default async function PaymentTermsDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PaymentTermsDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
