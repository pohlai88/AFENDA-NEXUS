import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import {
  getInstruments,
  getInstrumentSummary,
} from '@/features/finance/instruments/queries/instruments.queries';
import { InstrumentsSummaryCards } from '@/features/finance/instruments/blocks/instruments-summary-cards';
import { InstrumentsGrid } from '@/features/finance/instruments/blocks/instruments-grid';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Instruments' };

async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getInstrumentSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <InstrumentsSummaryCards summary={result.value} />;
}

async function InstrumentsSection() {
  const ctx = await getRequestContext();
  const result = await getInstruments(ctx, { status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <InstrumentsGrid instruments={result.value.data} />;
}

export default function InstrumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Instruments (IFRS 9)"
        description="Instrument register and fair value measurements"
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Instruments' },
        ]}
        primaryAction={{ label: 'New Instrument', href: routes.finance.instrumentNew }}
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
      <h2 className="text-xl font-semibold">Active Instruments</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
              <Skeleton key={`skeleton-${i}`} className="h-[200px]" />
            ))}
          </div>
        }
      >
        <InstrumentsSection />
      </Suspense>
    </div>
  );
}
