import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import { Plus, Calculator } from 'lucide-react';
import { getFixedAssets, getAssetSummary, getDepreciationRuns } from '@/features/finance/fixed-assets/queries/assets.queries';
import { AssetSummaryCards } from '@/features/finance/fixed-assets/blocks/asset-summary-cards';
import { AssetsTable } from '@/features/finance/fixed-assets/blocks/assets-table';

export const metadata = {
  title: 'Fixed Assets | Finance | Afenda',
  description: 'Manage fixed assets and depreciation',
};

// ─── Summary Section ─────────────────────────────────────────────────────────

async function SummarySection() {
  const result = await getAssetSummary();
  if (!result.ok) throw new Error(result.error);
  return <AssetSummaryCards summary={result.data} />;
}

// ─── Assets Section ──────────────────────────────────────────────────────────

async function AssetsSection({ status }: { status?: string }) {
  const result = await getFixedAssets({ status });
  if (!result.ok) throw new Error(result.error);
  return <AssetsTable assets={result.data} pagination={result.pagination} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface FixedAssetsPageProps {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function FixedAssetsPage({ searchParams }: FixedAssetsPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'all';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageHeaderHeading>Fixed Assets</PageHeaderHeading>
            <PageHeaderDescription>
              Manage fixed assets, track depreciation, and handle disposals.
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.fixedAssets}/depreciation`}>
                <Calculator className="mr-2 h-4 w-4" />
                Run Depreciation
              </Link>
            </Button>
            <Button asChild>
              <Link href={`${routes.finance.fixedAssets}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="fully_depreciated">Fully Depreciated</TabsTrigger>
          <TabsTrigger value="disposed">Disposed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="active">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection status="active" />
          </Suspense>
        </TabsContent>

        <TabsContent value="fully_depreciated">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection status="fully_depreciated" />
          </Suspense>
        </TabsContent>

        <TabsContent value="disposed">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection status="disposed" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
