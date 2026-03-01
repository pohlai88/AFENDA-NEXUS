import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function FixedAssetsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Fixed Assets">
      <PageHeader>
        <PageHeaderHeading>Fixed Assets</PageHeaderHeading>
        <PageHeaderDescription>
          Manage fixed assets, track depreciation, and handle disposals.
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
