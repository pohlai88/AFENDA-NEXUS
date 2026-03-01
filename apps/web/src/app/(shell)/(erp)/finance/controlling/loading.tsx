import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function ControllingLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Controlling">
      <PageHeader>
        <PageHeaderHeading>Controlling</PageHeaderHeading>
        <PageHeaderDescription>
          Cost Centers, Projects, Allocations
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
