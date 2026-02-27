import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { DashboardPage } from '@/components/erp/dashboard-page';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Customer Relationship Management — leads, opportunities, and accounts.',
};

export default function CRMDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Customer Relationship Management</PageHeaderHeading>
        <PageHeaderDescription>
          Track leads, manage opportunities, nurture customer relationships.
        </PageHeaderDescription>
      </PageHeader>

      <DashboardPage scope={{ type: 'module', id: 'crm' }} />
    </div>
  );
}
