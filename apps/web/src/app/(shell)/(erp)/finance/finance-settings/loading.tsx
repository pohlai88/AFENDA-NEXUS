import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function FinanceSettingsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Finance Settings">
      <PageHeader>
        <PageHeaderHeading>Finance Settings</PageHeaderHeading>
        <PageHeaderDescription>
          Payment Terms, Match Tolerances, Settings
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
