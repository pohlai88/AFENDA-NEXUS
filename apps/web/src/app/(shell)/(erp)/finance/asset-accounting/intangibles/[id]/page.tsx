import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { getIntangibleAssetById } from '@/features/finance/intangibles/queries/intangibles.queries';
import { IntangibleDetailHeader, IntangibleOverview } from '@/features/finance/intangibles/blocks/intangible-detail';
import { AmortizationSection, ImpairmentSection } from '@/features/finance/intangibles/blocks/intangible-sections';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getIntangibleAssetById(ctx, id);
  if (!result.ok) return { title: 'Intangible Asset | Finance' };
  return { title: `${result.data.assetNumber} | Intangibles` };
}

export default async function IntangibleDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getIntangibleAssetById(ctx, id);

  if (!result.ok) {
    if (result.error.includes('not found') || result.error.includes('Not found')) notFound();
    throw new Error(result.error);
  }

  const asset = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${asset.assetNumber} — ${asset.name}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Intangibles', href: routes.finance.intangibles },
          { label: asset.assetNumber },
        ]}
      />
      <BusinessDocument
        header={<IntangibleDetailHeader asset={asset} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <IntangibleOverview asset={asset} /> },
          {
            value: 'amortization',
            label: 'Amortization Schedule',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <AmortizationSection assetId={asset.id} />
              </Suspense>
            ),
          },
          {
            value: 'impairment',
            label: 'Impairment Tests',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <ImpairmentSection assetId={asset.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
