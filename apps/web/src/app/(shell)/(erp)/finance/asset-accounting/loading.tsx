import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function AssetAccountingLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Asset Accounting">
      <PageHeader>
        <PageHeaderHeading>Asset Accounting</PageHeaderHeading>
        <PageHeaderDescription>
          Fixed Assets, Depreciation, Intangibles
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
