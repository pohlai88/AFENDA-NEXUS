import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { DashboardPage } from '@/components/erp/dashboard-page';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boardroom',
  description: 'Team collaboration — announcements, meetings, documents, and polls.',
};

export default function BoardroomDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Boardroom</PageHeaderHeading>
        <PageHeaderDescription>
          Announcements, meetings, team chat, documents, and collaboration tools.
        </PageHeaderDescription>
      </PageHeader>

      <DashboardPage scope={{ type: 'module', id: 'boardroom' }} />
    </div>
  );
}
