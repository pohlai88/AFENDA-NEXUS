import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import { getCostDrivers } from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { CostDriversTable } from '@/features/finance/cost-accounting/blocks/cost-drivers-table';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Cost Drivers | Finance' };

async function DriversContent() {
  const ctx = await getRequestContext();
  const result = await getCostDrivers(ctx);

  if (!result.ok) {
    return <div className="text-destructive">Failed to load cost drivers.</div>;
  }

  return <CostDriversTable drivers={result.value.data as never[]} />;
}

function DriversSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[300px]" />
      <Skeleton className="h-[350px]" />
    </div>
  );
}

export default function CostDriversPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Drivers"
        description="Manage cost drivers used to allocate overhead costs."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'Drivers' },
        ]}
        actions={
          <Button asChild>
            <Link href={routes.finance.costDriverNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Driver
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<DriversSkeleton />}>
        <DriversContent />
      </Suspense>
    </div>
  );
}
