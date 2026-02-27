import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton } from '@/components/erp/loading-skeleton';

export default function HRMLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading HRM">
      <PageHeader>
        <PageHeaderHeading>Human Resource Management</PageHeaderHeading>
        <PageHeaderDescription>
          Manage employees, payroll, recruitment, performance, and training.
        </PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
