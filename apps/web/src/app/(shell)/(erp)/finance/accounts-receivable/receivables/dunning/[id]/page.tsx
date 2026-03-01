import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getDunningRun } from '@/features/finance/receivables/queries/dunning.queries';
import { DunningRunHeader, DunningLettersTable } from '@/features/finance/receivables/blocks/dunning-detail-blocks';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getDunningRun(ctx, id);
  if (!result.ok) return { title: 'Dunning Run | Finance' };
  return { title: `Dunning ${result.value.runDate} | Finance` };
}

export default async function DunningRunDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getDunningRun(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load dunning run');
  }

  const run = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title={`Dunning Run — ${run.runDate}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: 'Dunning', href: routes.finance.dunning },
          { label: run.runDate },
        ]}
      />
      <BusinessDocument
        header={<DunningRunHeader run={run} />}
        tabs={[
          {
            value: 'letters',
            label: `Letters (${run.letters.length})`,
            content: <DunningLettersTable letters={run.letters} />,
          },
        ]}
      />
    </div>
  </Suspense>
  );
}
