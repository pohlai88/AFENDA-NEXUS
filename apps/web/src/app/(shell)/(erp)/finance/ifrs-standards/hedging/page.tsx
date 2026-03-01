import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import {
  getHedgeRelationships,
  getHedgingSummary,
} from '@/features/finance/hedging/queries/hedging.queries';
import { HedgingSummaryCards } from '@/features/finance/hedging/blocks/hedging-summary-cards';
import { HedgeRelationshipsGrid } from '@/features/finance/hedging/blocks/hedge-relationships-grid';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Hedging' };

async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getHedgingSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <HedgingSummaryCards summary={result.value} />;
}

async function HedgesSection() {
  const ctx = await getRequestContext();
  const result = await getHedgeRelationships(ctx, { status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <HedgeRelationshipsGrid relationships={result.value.data} />;
}

export default function HedgingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hedge Accounting (IFRS 9)"
        description="Hedge relationships and effectiveness testing"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Hedging' },
        ]}
        primaryAction={{ label: 'Designate Hedge', href: routes.finance.hedgeNew }}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Hedge Relationships</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px]" />
            ))}
          </div>
        }
      >
        <HedgesSection />
      </Suspense>
    </div>
  );
}
