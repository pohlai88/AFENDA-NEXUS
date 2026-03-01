import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { DashboardPage } from '@/components/erp/dashboard-page';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HRM',
  description: 'Human Resource Management — employees, payroll, recruitment, and more.',
};

export default function HRMDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Human Resource Management</PageHeaderHeading>
        <PageHeaderDescription>
          Manage employees, payroll, recruitment, performance, and training.
        </PageHeaderDescription>
      </PageHeader>

      <DashboardPage scope={{ type: 'module', id: 'hrm' }} />
    </div>
  );
}
