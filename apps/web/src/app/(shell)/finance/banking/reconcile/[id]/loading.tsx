import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ReconcileLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="mt-1 h-4 w-96" />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main Workspace Skeleton */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton variant="table" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton variant="table" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
