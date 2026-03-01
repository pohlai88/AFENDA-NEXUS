import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function TaxLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Tax Management">
      <PageHeader>
        <PageHeaderHeading>Tax Management</PageHeaderHeading>
        <PageHeaderDescription>
          Manage tax codes, file returns, and issue withholding tax certificates.
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
