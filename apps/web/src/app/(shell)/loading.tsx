import { CardsSkeleton, DetailSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading Dashboard">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      <CardsSkeleton cards={4} />
      <DetailSkeleton />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
