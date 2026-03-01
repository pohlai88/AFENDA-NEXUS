import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { ReportCategoriesGrid } from '@/features/finance/reports/blocks/report-categories-grid';

export const metadata = { title: 'Financial Reports | Finance' };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader>
        <PageHeaderHeading>Financial Reports</PageHeaderHeading>
        <PageHeaderDescription>
          Standard financial statements, analysis, and compliance reports. Click any report to
          generate with your selected parameters.
        </PageHeaderDescription>
      </PageHeader>

      <ReportCategoriesGrid />
    </div>
  );
}
