import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ApprovalsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Approval Inbox</PageHeaderHeading>
        <PageHeaderDescription>
          Review and approve pending financial documents.
        </PageHeaderDescription>
      </PageHeader>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <LoadingSkeleton variant="table" />
      </div>
    </div>
  );
}
