import { getRequestContext } from '@/lib/auth';
import {
  getFixedAssets,
  getAssetSummary,
} from '@/features/finance/fixed-assets/queries/assets.queries';
import { AssetSummaryCards } from '@/features/finance/fixed-assets/blocks/asset-summary-cards';
import { AssetsTable } from '@/features/finance/fixed-assets/blocks/assets-table';

export async function AssetSummarySection() {
  const ctx = await getRequestContext();
  const result = await getAssetSummary(ctx);
  if (!result.ok) throw new Error(result.error);
  return <AssetSummaryCards summary={result.data} />;
}

export async function AssetListSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getFixedAssets(ctx, { status });
  if (!result.ok) throw new Error(result.error);
  return <AssetsTable assets={result.data} pagination={result.pagination} />;
}
