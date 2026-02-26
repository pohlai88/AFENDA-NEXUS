import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calculator, Building2 } from 'lucide-react';
import {
  getCostCenterTree,
  getCostDrivers,
  getAllocationRuns,
  getCostAccountingSummary,
} from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { CostCenterTree } from '@/features/finance/cost-accounting/blocks/cost-center-tree';
import { CostDriversTable } from '@/features/finance/cost-accounting/blocks/cost-drivers-table';
import { AllocationRunsTable } from '@/features/finance/cost-accounting/blocks/allocation-runs-table';
import { CostSummaryCards } from '@/features/finance/cost-accounting/blocks/cost-summary-cards';

async function SummarySection() {
  const result = await getCostAccountingSummary();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CostSummaryCards summary={result.data} />;
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

async function TreeSection() {
  const result = await getCostCenterTree();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CostCenterTree costCenters={result.data} />;
}

function TreeSkeleton() {
  return <Skeleton className="h-[400px]" />;
}

async function DriversSection() {
  const result = await getCostDrivers();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <CostDriversTable drivers={result.data} />;
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

async function AllocationsSection() {
  const result = await getAllocationRuns();
  if (!result.ok) {
    return <div className="text-destructive">{result.error}</div>;
  }
  return <AllocationRunsTable runs={result.data} />;
}

export default function CostCentersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Cost Accounting
          </h1>
          <p className="text-muted-foreground">
            Manage cost centers, drivers, and allocation runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/finance/cost-centers/allocations/new">
              <Calculator className="mr-2 h-4 w-4" />
              Run Allocation
            </Link>
          </Button>
          <Button asChild>
            <Link href="/finance/cost-centers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Cost Center
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
      </Suspense>

      <Tabs defaultValue="hierarchy">
        <TabsList>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="drivers">Cost Drivers</TabsTrigger>
          <TabsTrigger value="allocations">Allocation Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="mt-6">
          <Suspense fallback={<TreeSkeleton />}>
            <TreeSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <DriversSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="allocations" className="mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <AllocationsSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
