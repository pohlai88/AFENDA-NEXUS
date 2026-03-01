import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function ConsolidationLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Consolidation">
      <PageHeader>
        <PageHeaderHeading>Consolidation</PageHeaderHeading>
        <PageHeaderDescription>
          Group Entities, Eliminations, Goodwill
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
