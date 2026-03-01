import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calculator } from 'lucide-react';
import { PageHeader } from '@/components/erp/page-header';
import { routes } from '@/lib/constants';
import {
  SummarySkeleton,
  TreeSkeleton,
  TableSkeleton,
  SummarySection,
  TreeSection,
  DriversSection,
  AllocationsSection,
} from '@/features/finance/cost-accounting/blocks/cost-center-sections';

export const metadata = { title: 'Cost Accounting | Finance' };

export default function CostCentersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Accounting"
        description="Manage cost centers, drivers, and allocation runs."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Cost Accounting' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={routes.finance.allocationNew}>
                <Calculator className="mr-2 h-4 w-4" />
                Run Allocation
              </Link>
            </Button>
            <Button asChild>
              <Link href={routes.finance.costCenterNew}>
                <Plus className="mr-2 h-4 w-4" />
                New Cost Center
              </Link>
            </Button>
          </div>
        }
      />

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
