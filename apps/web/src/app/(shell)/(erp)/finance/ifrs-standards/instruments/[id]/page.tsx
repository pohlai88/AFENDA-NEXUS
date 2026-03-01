import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getInstrumentById, getInstrumentFairValues } from '@/features/finance/instruments/queries/instruments.queries';
import { InstrumentDetailHeader, InstrumentOverview, FairValueHistory } from '@/features/finance/instruments/blocks/instrument-detail';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getInstrumentById(ctx, id);
  if (!result.ok) return { title: 'Instrument | Finance' };
  return { title: `${result.value.instrumentNumber} | Instruments` };
}

async function ValuationsSection({ instrumentId }: { instrumentId: string }) {
  const ctx = await getRequestContext();
  const result = await getInstrumentFairValues(ctx, instrumentId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error.message}</p>;
  return <FairValueHistory valuations={result.value.data} />;
}

export default async function InstrumentDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getInstrumentById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load instrument');
  }

  const inst = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${inst.instrumentNumber} — ${inst.name}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Instruments', href: routes.finance.instruments },
          { label: inst.instrumentNumber },
        ]}
      />
      <BusinessDocument
        header={<InstrumentDetailHeader inst={inst} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <InstrumentOverview inst={inst} /> },
          {
            value: 'valuations',
            label: 'Fair Value History',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <ValuationsSection instrumentId={inst.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
