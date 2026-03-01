import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton } from '@/components/erp/loading-skeleton';

export default function CRMLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading CRM">
      <PageHeader>
        <PageHeaderHeading>Customer Relationship Management</PageHeaderHeading>
        <PageHeaderDescription>
          Track leads, manage opportunities, nurture customer relationships.
        </PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
