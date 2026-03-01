import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function TravelExpensesLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Travel & Expenses">
      <PageHeader>
        <PageHeaderHeading>Travel & Expenses</PageHeaderHeading>
        <PageHeaderDescription>
          Expense Claims, Policies, Reimbursement
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
