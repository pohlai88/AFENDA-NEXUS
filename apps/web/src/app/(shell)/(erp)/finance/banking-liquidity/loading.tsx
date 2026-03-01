import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function BankingLiquidityLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Banking & Liquidity">
      <PageHeader>
        <PageHeaderHeading>Banking & Liquidity</PageHeaderHeading>
        <PageHeaderDescription>
          Bank Statements, Reconciliation
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
