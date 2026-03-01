import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function IntercompanyLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Intercompany">
      <PageHeader>
        <PageHeaderHeading>Intercompany</PageHeaderHeading>
        <PageHeaderDescription>
          IC Transactions, Transfer Pricing
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
