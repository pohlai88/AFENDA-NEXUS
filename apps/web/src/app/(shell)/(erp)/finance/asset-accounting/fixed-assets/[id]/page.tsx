import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { RequestContext } from '@afenda/core';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import {
  getFixedAssetById,
  getDepreciationSchedule,
} from '@/features/finance/fixed-assets/queries/assets.queries';
import { AssetDetail } from '@/features/finance/fixed-assets/blocks/asset-detail';
import { getRequestContext } from '@/lib/auth';

export const metadata = {
  title: 'Asset Detail | Fixed Assets | Afenda',
  description: 'View fixed asset details and depreciation schedule',
};

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AssetDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const [assetResult, scheduleResult] = await Promise.all([
    getFixedAssetById(ctx, id),
    getDepreciationSchedule(ctx, id),
  ]);

  if (!assetResult.ok) {
    notFound();
  }

  if (!scheduleResult.ok) {
    throw new Error(scheduleResult.error);
  }

  return <AssetDetail asset={assetResult.data} schedule={scheduleResult.data} />;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AssetDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
