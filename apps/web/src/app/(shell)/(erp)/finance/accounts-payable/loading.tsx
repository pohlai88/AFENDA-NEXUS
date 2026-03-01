import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function AccountsPayableLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Accounts Payable">
      <PageHeader>
        <PageHeaderHeading>Accounts Payable</PageHeaderHeading>
        <PageHeaderDescription>
          AP Invoices, Payment Runs, Suppliers
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
