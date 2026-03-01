import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { Upload } from 'lucide-react';
import { ReconciliationStatsCards } from '@/features/finance/banking/blocks/reconciliation-stats-cards';
import { BankAccountsSection, StatementsSection } from '@/features/finance/banking/blocks/banking-sections';

export const metadata = {
  title: 'Banking | Finance | Afenda',
  description: 'Bank account management and reconciliation',
};

interface BankingPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function BankingPage({ searchParams }: BankingPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'overview';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageHeaderHeading>Bank Reconciliation</PageHeaderHeading>
            <PageHeaderDescription>
              Manage bank accounts and reconcile statements with your general ledger.
            </PageHeaderDescription>
          </div>
          <Button asChild>
            <Link href={`${routes.finance.banking}/import`}>
              <Upload className="mr-2 h-4 w-4" />
              Import Statement
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <ReconciliationStatsCards />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<LoadingSkeleton variant="detail" />}>
            <BankAccountsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="accounts">
          <Suspense fallback={<LoadingSkeleton variant="detail" />}>
            <BankAccountsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="statements">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <StatementsSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
