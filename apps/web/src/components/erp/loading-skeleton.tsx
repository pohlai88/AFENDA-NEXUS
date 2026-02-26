import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

function Skeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table data">
      <div className="flex gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading document">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading form">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/** Generic page loading skeleton with variant support */
export function LoadingSkeleton({ variant = 'detail' }: { variant?: 'table' | 'detail' | 'form' }) {
  if (variant === 'table') return <TableSkeleton />;
  if (variant === 'form') return <FormSkeleton />;
  return <DetailSkeleton />;
}

export { Skeleton };
