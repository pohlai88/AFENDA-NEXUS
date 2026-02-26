import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TaxLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Tax Management</PageHeaderHeading>
        <PageHeaderDescription>
          Manage tax codes, file returns, and issue withholding tax certificates.
        </PageHeaderDescription>
      </PageHeader>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <LoadingSkeleton variant="table" />
      </div>
    </div>
  );
}
