import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import { getAllocationRuns } from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { AllocationRunsTable } from '@/features/finance/cost-accounting/blocks/allocation-runs-table';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Allocation Runs | Finance' };

async function AllocationsContent() {
  const ctx = await getRequestContext();
  const result = await getAllocationRuns(ctx);

  if (!result.ok) {
    return <div className="text-destructive">Failed to load allocation runs.</div>;
  }

  return <AllocationRunsTable runs={result.value.data as never[]} />;
}

function AllocationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[300px]" />
      <Skeleton className="h-[350px]" />
    </div>
  );
}

export default function AllocationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocation Runs"
        description="Review and manage cost allocation runs."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'Allocations' },
        ]}
        actions={
          <Button asChild>
            <Link href={routes.finance.allocationNew}>
              <Plus className="mr-2 h-4 w-4" />
              Run Allocation
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<AllocationsSkeleton />}>
        <AllocationsContent />
      </Suspense>
    </div>
  );
}
