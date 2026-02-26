import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Calculator } from 'lucide-react';
import { getLeases, getLeaseSummary } from '@/features/finance/leases/queries/leases.queries';
import { LeasesTable } from '@/features/finance/leases/blocks/leases-table';
import { LeaseSummaryCards } from '@/features/finance/leases/blocks/lease-summary-cards';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getLeaseSummary();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <LeaseSummaryCards summary={result.data} />;
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

async function LeasesSection({ status }: { status?: string }) {
  const result = await getLeases({ status });
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <LeasesTable leases={result.data} />;
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

export default function LeasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Lease Accounting (IFRS 16)
          </h1>
          <p className="text-muted-foreground">
            Manage lease contracts, ROU assets, and liability schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.finance.leaseRunPeriod}>
              <Calculator className="mr-2 h-4 w-4" />
              Run Period
            </Link>
          </Button>
          <Button asChild>
            <Link href={routes.finance.leaseNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Lease
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Leases</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LeasesSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LeasesSection status="active" />
          </Suspense>
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LeasesSection status="draft" />
          </Suspense>
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LeasesSection status="expired" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
