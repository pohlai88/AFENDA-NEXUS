import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntangiblesLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Intangible Assets">
      <PageHeader>
        <PageHeaderHeading>Intangible Assets</PageHeaderHeading>
        <PageHeaderDescription>
          Manage intangible assets, track amortization, and perform impairment tests.
        </PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <TableSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
