import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import { Plus } from 'lucide-react';
import {
  getExpenseClaims,
  getExpenseSummary,
} from '@/features/finance/expenses/queries/expenses.queries';
import { ExpenseSummaryCards } from '@/features/finance/expenses/blocks/expense-summary-cards';
import { ClaimsTable } from '@/features/finance/expenses/blocks/claims-table';

export const metadata = {
  title: 'Expense Claims | Finance | Afenda',
  description: 'Manage employee expense claims and reimbursements',
};

// ─── Summary Section ─────────────────────────────────────────────────────────

async function SummarySection() {
  const result = await getExpenseSummary();
  if (!result.ok) throw new Error(result.error);
  return <ExpenseSummaryCards summary={result.data} />;
}

// ─── Claims Section ──────────────────────────────────────────────────────────

async function ClaimsSection({ status }: { status?: string }) {
  const result = await getExpenseClaims({ status });
  if (!result.ok) throw new Error(result.error);
  return <ClaimsTable claims={result.data} pagination={result.pagination} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface ExpensesPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'all';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageHeaderHeading>Expense Claims</PageHeaderHeading>
            <PageHeaderDescription>
              Submit, track, and manage employee expense reimbursements.
            </PageHeaderDescription>
          </div>
          <Button asChild>
            <Link href={`${routes.finance.expenses}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Claim
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Claims</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="draft">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection status="draft" />
          </Suspense>
        </TabsContent>

        <TabsContent value="pending_approval">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection status="pending_approval" />
          </Suspense>
        </TabsContent>

        <TabsContent value="approved">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection status="approved" />
          </Suspense>
        </TabsContent>

        <TabsContent value="paid">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection status="paid" />
          </Suspense>
        </TabsContent>

        <TabsContent value="rejected">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <ClaimsSection status="rejected" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
