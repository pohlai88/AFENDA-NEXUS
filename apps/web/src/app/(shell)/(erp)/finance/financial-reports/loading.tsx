import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function FinancialReportsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Financial Reports">
      <PageHeader>
        <PageHeaderHeading>Financial Reports</PageHeaderHeading>
        <PageHeaderDescription>
          Balance Sheet, Income Statement, Cash Flow
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
