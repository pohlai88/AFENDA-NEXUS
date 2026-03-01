import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TaxSummarySection,
  TaxCodesSection,
  TaxReturnsSection,
  WHTCertificatesSection,
} from '@/features/finance/tax/blocks/tax-sections';

export const metadata = { title: 'Tax Management | Finance | Afenda' };

interface TaxPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function TaxPage({ searchParams }: TaxPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'overview';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Tax Management</PageHeaderHeading>
        <PageHeaderDescription>Manage tax codes, file returns, and issue withholding tax certificates.</PageHeaderDescription>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <TaxSummarySection />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="codes">Tax Codes</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="wht">WHT Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Upcoming Tax Returns</h3>
            <Suspense fallback={<LoadingSkeleton variant="table" />}><TaxReturnsSection /></Suspense>
          </div>
        </TabsContent>
        <TabsContent value="codes">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><TaxCodesSection /></Suspense>
        </TabsContent>
        <TabsContent value="returns">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><TaxReturnsSection /></Suspense>
        </TabsContent>
        <TabsContent value="wht">
          <Suspense fallback={<LoadingSkeleton variant="table" />}><WHTCertificatesSection /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
