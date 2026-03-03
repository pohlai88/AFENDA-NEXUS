import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton } from '@/components/erp/loading-skeleton';

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Home">
      <PageHeader>
        <PageHeaderHeading>Home</PageHeaderHeading>
        <PageHeaderDescription>Welcome back to Afenda.</PageHeaderDescription>
      </PageHeader>
      <CardsSkeleton cards={4} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
