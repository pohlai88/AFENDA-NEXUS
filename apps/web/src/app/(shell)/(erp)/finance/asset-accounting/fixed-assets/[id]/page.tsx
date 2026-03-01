import { Suspense } from 'react';
import { notFound } from 'next/navigation';
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

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

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

  return <Suspense fallback={<LoadingSkeleton />}><AssetDetail asset={assetResult.data} schedule={scheduleResult.data} /></Suspense>;
}
