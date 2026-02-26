import { notFound } from 'next/navigation';
import { getFixedAssetById, getDepreciationSchedule } from '@/features/finance/fixed-assets/queries/assets.queries';
import { AssetDetail } from '@/features/finance/fixed-assets/blocks/asset-detail';

export const metadata = {
  title: 'Asset Detail | Fixed Assets | Afenda',
  description: 'View fixed asset details and depreciation schedule',
};

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params;

  const [assetResult, scheduleResult] = await Promise.all([
    getFixedAssetById(id),
    getDepreciationSchedule(id),
  ]);

  if (!assetResult.ok) {
    notFound();
  }

  if (!scheduleResult.ok) {
    throw new Error(scheduleResult.error);
  }

  return (
    <AssetDetail
      asset={assetResult.data}
      schedule={scheduleResult.data}
    />
  );
}
