import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import { Upload, FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { getBankAccounts, getBankStatements, getReconciliationStats } from '@/features/finance/banking/queries/banking.queries';
import { BankAccountsList } from '@/features/finance/banking/blocks/bank-accounts-list';
import { StatementsTable } from '@/features/finance/banking/blocks/statements-table';

export const metadata = {
  title: 'Banking | Finance | Afenda',
  description: 'Bank account management and reconciliation',
};

// ─── Stats Cards ─────────────────────────────────────────────────────────────

async function ReconciliationStatsCards() {
  const result = await getReconciliationStats();
  if (!result.ok) return null;

  const stats = result.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <CardDescription>Pending</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingStatements}</div>
          <p className="text-xs text-muted-foreground">statements awaiting import</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <FileText className="h-4 w-4" />
            <CardDescription>In Progress</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgressStatements}</div>
          <p className="text-xs text-muted-foreground">reconciliations in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <CardDescription>Unmatched Items</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUnmatchedItems}</div>
          <p className="text-xs text-muted-foreground">transactions to review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <CardDescription>Days Since Reconciled</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unreconciledDays}</div>
          <p className="text-xs text-muted-foreground">
            last: {stats.lastReconciledDate?.toLocaleDateString() ?? 'Never'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Bank Accounts Section ───────────────────────────────────────────────────

async function BankAccountsSection() {
  const result = await getBankAccounts();
  if (!result.ok) throw new Error(result.error);
  return <BankAccountsList accounts={result.data} />;
}

// ─── Statements Section ──────────────────────────────────────────────────────

async function StatementsSection() {
  const result = await getBankStatements();
  if (!result.ok) throw new Error(result.error);
  return <StatementsTable statements={result.data} pagination={result.pagination} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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
