import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Landmark, FileCheck, TrendingUp } from 'lucide-react';
import {
  getCashForecasts,
  getCovenants,
  getIntercompanyLoans,
  getTreasurySummary,
} from '@/features/finance/treasury/queries/treasury.queries';
import { TreasurySummaryCards } from '@/features/finance/treasury/blocks/treasury-summary-cards';
import { CovenantsTable } from '@/features/finance/treasury/blocks/covenants-table';
import { ICLoansTable } from '@/features/finance/treasury/blocks/ic-loans-table';

async function SummarySection() {
  const result = await getTreasurySummary();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <TreasurySummaryCards summary={result.data} />;
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

async function CovenantsSection() {
  const result = await getCovenants();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CovenantsTable covenants={result.data} />;
}

async function LoansSection() {
  const result = await getIntercompanyLoans();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <ICLoansTable loans={result.data} />;
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

export default function TreasuryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8" />
            Treasury Management
          </h1>
          <p className="text-muted-foreground">
            Cash forecasting, covenant monitoring, and intercompany loans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/finance/treasury/forecasts/new">
              <TrendingUp className="mr-2 h-4 w-4" />
              New Forecast
            </Link>
          </Button>
          <Button asChild>
            <Link href="/finance/treasury/loans/new">
              <Plus className="mr-2 h-4 w-4" />
              New IC Loan
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue="covenants">
        <TabsList>
          <TabsTrigger value="covenants">
            <FileCheck className="mr-2 h-4 w-4" />
            Covenants
          </TabsTrigger>
          <TabsTrigger value="loans">
            <Landmark className="mr-2 h-4 w-4" />
            IC Loans
          </TabsTrigger>
          <TabsTrigger value="forecasts">
            <TrendingUp className="mr-2 h-4 w-4" />
            Forecasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="covenants" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <CovenantsSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="loans" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LoansSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="forecasts" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Cash forecasting module - coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
