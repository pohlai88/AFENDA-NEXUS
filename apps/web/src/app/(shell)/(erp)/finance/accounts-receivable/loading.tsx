import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function AccountsReceivableLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Accounts Receivable">
      <PageHeader>
        <PageHeaderHeading>Accounts Receivable</PageHeaderHeading>
        <PageHeaderDescription>
          AR Invoices, Credit Control, Collections
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
