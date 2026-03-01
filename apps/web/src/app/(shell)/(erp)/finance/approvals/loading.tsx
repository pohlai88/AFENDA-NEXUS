import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/erp/page-header';
import { CardsSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Approvals">
      <PageHeader>
        <PageHeaderHeading>Approval Inbox</PageHeaderHeading>
        <PageHeaderDescription>
          Review and approve pending financial documents.
        </PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton cards={6} />
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-9 w-24" />
          ))}
        </div>
        <TableSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
