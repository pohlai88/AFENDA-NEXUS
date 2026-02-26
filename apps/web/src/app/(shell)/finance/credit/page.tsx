import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CreditCard, Ban, FileText } from 'lucide-react';
import {
  getCustomerCredits,
  getCreditReviews,
  getCreditHolds,
  getCreditSummary,
} from '@/features/finance/credit/queries/credit.queries';
import { CreditSummaryCards } from '@/features/finance/credit/blocks/credit-summary-cards';
import { CustomerCreditsTable } from '@/features/finance/credit/blocks/customer-credits-table';
import { CreditHoldsTable } from '@/features/finance/credit/blocks/credit-holds-table';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getCreditSummary();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CreditSummaryCards summary={result.data} />;
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px]" />
      ))}
    </div>
  );
}

async function CreditsSection({ status }: { status?: string }) {
  const result = await getCustomerCredits({ status });
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CustomerCreditsTable credits={result.data} />;
}

async function HoldsSection() {
  const result = await getCreditHolds({ status: 'active' });
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CreditHoldsTable holds={result.data} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[350px]" />
    </div>
  );
}

export default function CreditPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Credit Management
          </h1>
          <p className="text-muted-foreground">
            Customer credit limits, reviews, and hold management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.finance.creditReviews}>
              <FileText className="mr-2 h-4 w-4" />
              Reviews
            </Link>
          </Button>
          <Button asChild>
            <Link href={routes.finance.creditNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer Credit
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="on_hold">
            <Ban className="mr-2 h-4 w-4" />
            On Hold
          </TabsTrigger>
          <TabsTrigger value="holds">Active Holds</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <CreditsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <CreditsSection status="active" />
          </Suspense>
        </TabsContent>

        <TabsContent value="on_hold" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <CreditsSection status="on_hold" />
          </Suspense>
        </TabsContent>

        <TabsContent value="holds" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <HoldsSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
