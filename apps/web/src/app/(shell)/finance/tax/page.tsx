import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getTaxCodes,
  getTaxReturnPeriods,
  getWHTCertificates,
  getTaxSummary,
} from '@/features/finance/tax/queries/tax.queries';
import { TaxSummaryCards } from '@/features/finance/tax/blocks/tax-summary-cards';
import { TaxCodesTable } from '@/features/finance/tax/blocks/tax-codes-table';
import { TaxReturnsTable } from '@/features/finance/tax/blocks/tax-returns-table';
import { WHTCertificatesTable } from '@/features/finance/tax/blocks/wht-certificates-table';

export const metadata = {
  title: 'Tax Management | Finance | Afenda',
  description: 'Manage tax codes, returns, and withholding tax certificates',
};

// ─── Summary Section ─────────────────────────────────────────────────────────

async function TaxSummarySection() {
  const result = await getTaxSummary();
  if (!result.ok) throw new Error(result.error);
  return <TaxSummaryCards summary={result.data} />;
}

// ─── Tax Codes Section ───────────────────────────────────────────────────────

async function TaxCodesSection() {
  const result = await getTaxCodes({ status: 'active' });
  if (!result.ok) throw new Error(result.error);
  return <TaxCodesTable taxCodes={result.data} />;
}

// ─── Tax Returns Section ─────────────────────────────────────────────────────

async function TaxReturnsSection() {
  const result = await getTaxReturnPeriods({ year: 2026 });
  if (!result.ok) throw new Error(result.error);
  return <TaxReturnsTable periods={result.data} />;
}

// ─── WHT Certificates Section ────────────────────────────────────────────────

async function WHTCertificatesSection() {
  const result = await getWHTCertificates();
  if (!result.ok) throw new Error(result.error);
  return <WHTCertificatesTable certificates={result.data} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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
        <PageHeaderDescription>
          Manage tax codes, file returns, and issue withholding tax certificates.
        </PageHeaderDescription>
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
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming Tax Returns</h3>
              <Suspense fallback={<LoadingSkeleton variant="table" />}>
                <TaxReturnsSection />
              </Suspense>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="codes">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <TaxCodesSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="returns">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <TaxReturnsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="wht">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <WHTCertificatesSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
