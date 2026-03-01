import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import {
  getDeferredTaxItems,
  getDeferredTaxSummary,
} from '@/features/finance/deferred-tax/queries/deferred-tax.queries';
import { DeferredTaxSummaryCards } from '@/features/finance/deferred-tax/blocks/deferred-tax-summary-cards';
import { DeferredTaxItemsTable } from '@/features/finance/deferred-tax/blocks/deferred-tax-items-table';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Deferred Tax' };

async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getDeferredTaxSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <DeferredTaxSummaryCards summary={result.value} />;
}

async function ItemsSection() {
  const ctx = await getRequestContext();
  const result = await getDeferredTaxItems(ctx, { status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <DeferredTaxItemsTable items={result.value.data} />;
}

export default function DeferredTaxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deferred Tax (IAS 12)"
        description="Deferred tax assets, liabilities, and movements"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Deferred Tax' },
        ]}
        primaryAction={{ label: 'New Item', href: routes.finance.deferredTaxNew }}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
              <Skeleton key={`skeleton-${i}`} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Items</h2>
      <Suspense fallback={<Skeleton className="h-[350px]" />}>
        <ItemsSection />
      </Suspense>
    </div>
  );
}
