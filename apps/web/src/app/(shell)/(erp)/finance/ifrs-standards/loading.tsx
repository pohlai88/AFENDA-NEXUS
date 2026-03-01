import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function IfrsStandardsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading IFRS Standards">
      <PageHeader>
        <PageHeaderHeading>IFRS Standards</PageHeaderHeading>
        <PageHeaderDescription>
          Leases, Provisions, Instruments, Hedging
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
