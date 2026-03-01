import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getHedgeRelationshipById, getEffectivenessTests } from '@/features/finance/hedging/queries/hedging.queries';
import { HedgeDetailHeader, HedgeOverview, EffectivenessTestsList } from '@/features/finance/hedging/blocks/hedge-detail';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getHedgeRelationshipById(ctx, id);
  if (!result.ok) return { title: 'Hedge | Finance' };
  return { title: `${result.value.relationshipNumber} | Hedging` };
}

async function EffectivenessSection({ relationshipId }: { relationshipId: string }) {
  const ctx = await getRequestContext();
  const result = await getEffectivenessTests(ctx, relationshipId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error.message}</p>;
  return <EffectivenessTestsList tests={result.value.data} />;
}

export default async function HedgeDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getHedgeRelationshipById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load hedge relationship');
  }

  const hedge = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${hedge.relationshipNumber} — ${hedge.name}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Hedging', href: routes.finance.hedges },
          { label: hedge.relationshipNumber },
        ]}
      />
      <BusinessDocument
        header={<HedgeDetailHeader hedge={hedge} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <HedgeOverview hedge={hedge} /> },
          {
            value: 'effectiveness',
            label: 'Effectiveness Tests',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <EffectivenessSection relationshipId={hedge.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
