import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { TableSkeleton } from '@/components/erp/loading-skeleton';

export default function TaxComplianceLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Tax & Compliance">
      <PageHeader>
        <PageHeaderHeading>Tax & Compliance</PageHeaderHeading>
        <PageHeaderDescription>
          Tax Codes, Returns, WHT Certificates
        </PageHeaderDescription>
      </PageHeader>
      <TableSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
