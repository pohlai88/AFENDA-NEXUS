import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import { Plus, Calculator } from 'lucide-react';
import Link from 'next/link';
import { AssetSummarySection, AssetListSection } from '@/features/finance/fixed-assets/blocks/asset-sections';

export const metadata = { title: 'Fixed Assets | Finance | Afenda' };

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
            <PageHeaderDescription>Manage fixed assets, track depreciation, and handle disposals.</PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.fixedAssets}/depreciation`}><Calculator className="mr-2 h-4 w-4" />Run Depreciation</Link>
            </Button>
            <Button asChild>
              <Link href={`${routes.finance.fixedAssets}/new`}><Plus className="mr-2 h-4 w-4" />Add Asset</Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <AssetSummarySection />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="fully_depreciated">Fully Depreciated</TabsTrigger>
          <TabsTrigger value="disposed">Disposed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><AssetListSection /></Suspense>
        </TabsContent>
        <TabsContent value="active">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><AssetListSection status="active" /></Suspense>
        </TabsContent>
        <TabsContent value="fully_depreciated">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><AssetListSection status="fully_depreciated" /></Suspense>
        </TabsContent>
        <TabsContent value="disposed">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><AssetListSection status="disposed" /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
