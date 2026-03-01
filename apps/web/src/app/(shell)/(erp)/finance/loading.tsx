import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { CardsSkeleton, DetailSkeleton, TableSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FinanceDashboardLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading Finance Dashboard">
      <PageHeader>
        <PageHeaderHeading>Finance Dashboard</PageHeaderHeading>
        <PageHeaderDescription>
          Overview of your organization&apos;s financial health and key metrics.
        </PageHeaderDescription>
      </PageHeader>

      <CardsSkeleton cards={4} />

      <DetailSkeleton />

      {/* Charts Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton />
        </div>
        <DetailSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
