import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton } from '@/components/erp/loading-skeleton';

export default function BoardroomLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Boardroom">
      <PageHeader>
        <PageHeaderHeading>Boardroom</PageHeaderHeading>
        <PageHeaderDescription>
          Announcements, meetings, team chat, documents, and collaboration tools.
        </PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
