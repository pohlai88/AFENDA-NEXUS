import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function GeneralLedgerLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading General Ledger">
      <PageHeader>
        <PageHeaderHeading>General Ledger</PageHeaderHeading>
        <PageHeaderDescription>
          Chart of Accounts, Journals, Periods
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
