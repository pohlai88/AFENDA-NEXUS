import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import { Plus, Calculator } from 'lucide-react';
import { getIntangibleAssets, getIntangibleSummary } from '@/features/finance/intangibles/queries/intangibles.queries';
import { IntangibleSummaryCards } from '@/features/finance/intangibles/blocks/intangible-summary-cards';
import { IntangiblesTable } from '@/features/finance/intangibles/blocks/intangibles-table';

export const metadata = {
  title: 'Intangible Assets | Finance | Afenda',
  description: 'Manage intangible assets and amortization',
};

// ─── Summary Section ─────────────────────────────────────────────────────────

async function SummarySection() {
  const result = await getIntangibleSummary();
  if (!result.ok) throw new Error(result.error);
  return <IntangibleSummaryCards summary={result.data} />;
}

// ─── Assets Section ──────────────────────────────────────────────────────────

async function AssetsSection({ status, type }: { status?: string; type?: string }) {
  const result = await getIntangibleAssets({ status, intangibleType: type });
  if (!result.ok) throw new Error(result.error);
  return <IntangiblesTable assets={result.data} pagination={result.pagination} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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
            <PageHeaderDescription>
              Manage intangible assets, track amortization, and perform impairment tests.
            </PageHeaderDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.intangibles}/amortization`}>
                <Calculator className="mr-2 h-4 w-4" />
                Run Amortization
              </Link>
            </Button>
            <Button asChild>
              <Link href={`${routes.finance.intangibles}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Intangible
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
          <TabsTrigger value="goodwill">Goodwill</TabsTrigger>
          <TabsTrigger value="software">Software</TabsTrigger>
          <TabsTrigger value="patents">Patents</TabsTrigger>
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

        <TabsContent value="goodwill">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection type="goodwill" />
          </Suspense>
        </TabsContent>

        <TabsContent value="software">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection type="software" />
          </Suspense>
        </TabsContent>

        <TabsContent value="patents">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <AssetsSection type="patent" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
