import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function TreasuryLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Treasury">
      <PageHeader>
        <PageHeaderHeading>Treasury</PageHeaderHeading>
        <PageHeaderDescription>
          Cash Forecasts, FX Rates, Loans
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
