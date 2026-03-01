import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import { Plus, Calculator } from 'lucide-react';
import Link from 'next/link';
import {
  IntangibleSummarySection,
  IntangibleAssetsSection,
} from '@/features/finance/intangibles/blocks/intangible-sections';

export const metadata = { title: 'Intangible Assets | Finance | Afenda' };

interface IntangiblesPageProps {
  searchParams: Promise<{ tab?: string; type?: string }>;
}

export default async function IntangiblesPage({ searchParams }: IntangiblesPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'all';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageHeaderHeading>Intangible Assets</PageHeaderHeading>
            <PageHeaderDescription>Manage intangible assets, track amortization, and perform impairment tests.</PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.intangibles}/amortization`}><Calculator className="mr-2 h-4 w-4" />Run Amortization</Link>
            </Button>
            <Button asChild>
              <Link href={`${routes.finance.intangibles}/new`}><Plus className="mr-2 h-4 w-4" />Add Intangible</Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <IntangibleSummarySection />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="goodwill">Goodwill</TabsTrigger>
          <TabsTrigger value="software">Software</TabsTrigger>
          <TabsTrigger value="patents">Patents</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><IntangibleAssetsSection /></Suspense>
        </TabsContent>
        <TabsContent value="active">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><IntangibleAssetsSection status="active" /></Suspense>
        </TabsContent>
        <TabsContent value="goodwill">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><IntangibleAssetsSection type="goodwill" /></Suspense>
        </TabsContent>
        <TabsContent value="software">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><IntangibleAssetsSection type="software" /></Suspense>
        </TabsContent>
        <TabsContent value="patents">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><IntangibleAssetsSection type="patent" /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
