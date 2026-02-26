import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FinanceDashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Finance Dashboard</PageHeaderHeading>
        <PageHeaderDescription>
          Overview of your organization's financial health and key metrics.
        </PageHeaderDescription>
      </PageHeader>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attention Panel Skeleton */}
      <LoadingSkeleton variant="detail" />

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
          <LoadingSkeleton variant="table" />
        </div>
        <LoadingSkeleton variant="detail" />
      </div>
    </div>
  );
}
