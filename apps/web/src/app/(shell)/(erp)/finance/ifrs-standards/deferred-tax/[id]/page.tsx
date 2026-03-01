import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getDeferredTaxItemById, getDeferredTaxMovements } from '@/features/finance/deferred-tax/queries/deferred-tax.queries';
import { DeferredTaxDetailHeader, DeferredTaxOverview, DeferredTaxMovements } from '@/features/finance/deferred-tax/blocks/deferred-tax-detail';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getDeferredTaxItemById(ctx, id);
  if (!result.ok) return { title: 'Deferred Tax | Finance' };
  return { title: `${result.value.itemNumber} | Deferred Tax` };
}

async function MovementsSection({ itemId }: { itemId: string }) {
  const ctx = await getRequestContext();
  const result = await getDeferredTaxMovements(ctx, itemId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error.message}</p>;
  return <DeferredTaxMovements movements={result.value.data} />;
}

export default async function DeferredTaxDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getDeferredTaxItemById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load deferred tax item');
  }

  const item = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${item.itemNumber} — ${item.description}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Deferred Tax', href: routes.finance.deferredTax },
          { label: item.itemNumber },
        ]}
      />
      <BusinessDocument
        header={<DeferredTaxDetailHeader item={item} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <DeferredTaxOverview item={item} /> },
          {
            value: 'movements',
            label: 'Movements',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <MovementsSection itemId={item.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
